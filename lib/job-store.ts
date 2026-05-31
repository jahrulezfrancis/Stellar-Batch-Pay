/**
 * Durable job store backed by SQLite (better-sqlite3).
 *
 * Replaces the previous in-memory Map so that batch progress survives server
 * restarts and serverless cold-starts that recycle the execution context.
 *
 * Schema
 * ──────
 * jobs
 *   jobId       TEXT PRIMARY KEY
 *   publicKey   TEXT            -- Stellar wallet that owns the job
 *   status      TEXT NOT NULL
 *   totalBatches    INTEGER NOT NULL DEFAULT 0
 *   completedBatches INTEGER NOT NULL DEFAULT 0
 *   payments    TEXT NOT NULL   -- JSON-serialised PaymentInstruction[]
 *   network     TEXT NOT NULL
 *   result      TEXT            -- JSON-serialised BatchResult | NULL
 *   error       TEXT
 *   createdAt   TEXT NOT NULL
 *   updatedAt   TEXT NOT NULL
 *
 * Indexes on jobId (implicit via PRIMARY KEY) and createdAt for history queries.
 */

import Database from "better-sqlite3";
import path from "path";
import type {
  JobState,
  JobStatus,
  PaymentInstruction,
  BatchResult,
} from "./stellar/types";
import { escapeLikePattern } from "./history-filters";

export interface IdempotentJobResult<ResponseBody> {
  jobId: string;
  responseBody: ResponseBody;
  replayed: boolean;
}

export class IdempotencyConflictError extends Error {
  constructor() {
    super("Idempotency key already exists for a different request body");
    this.name = "IdempotencyConflictError";
  }
}

interface BatchJobArgs {
  payments: PaymentInstruction[];
  signedTransactions?: string[];
  network: "testnet" | "mainnet";
  publicKey: string;
}

interface IdempotencyRow {
  idempotencyKey: string;
  requestHash: string;
  jobId: string;
  responseBody: string;
  createdAt: string;
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// DB initialisation
// ---------------------------------------------------------------------------

const DB_PATH =
  process.env.JOB_STORE_PATH ?? path.join(process.cwd(), "data", "jobs.db");

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure the data directory exists at runtime
  const { mkdirSync } = require("fs") as typeof import("fs");
  mkdirSync(path.dirname(DB_PATH), { recursive: true });

  _db = new Database(DB_PATH);

  // WAL mode for better concurrent read performance
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      jobId            TEXT PRIMARY KEY,
      publicKey        TEXT,
      status           TEXT NOT NULL,
      totalBatches     INTEGER NOT NULL DEFAULT 0,
      completedBatches INTEGER NOT NULL DEFAULT 0,
      payments         TEXT NOT NULL,
      signedTransactions TEXT,
      network          TEXT NOT NULL,
      result           TEXT,
      error            TEXT,
      createdAt        TEXT NOT NULL,
      updatedAt        TEXT NOT NULL
    );

    -- Index for history queries ordered by creation time
    CREATE INDEX IF NOT EXISTS idx_jobs_createdAt ON jobs (createdAt DESC);

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      idempotencyKey   TEXT PRIMARY KEY,
      requestHash      TEXT NOT NULL,
      jobId            TEXT NOT NULL,
      responseBody     TEXT NOT NULL,
      createdAt        TEXT NOT NULL,
      expiresAt        TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expiresAt ON idempotency_keys (expiresAt);
  `);

  const columns = _db.prepare("PRAGMA table_info(jobs)").all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === "publicKey")) {
    _db.exec("ALTER TABLE jobs ADD COLUMN publicKey TEXT");
  }
  _db.exec("CREATE INDEX IF NOT EXISTS idx_jobs_publicKey_createdAt ON jobs (publicKey, createdAt DESC)");

  return _db;
}

// ---------------------------------------------------------------------------
// Row ↔ JobState helpers
// ---------------------------------------------------------------------------

interface JobRow {
  jobId: string;
  publicKey: string | null;
  status: JobStatus;
  totalBatches: number;
  completedBatches: number;
  payments: string;
  signedTransactions: string | null;
  network: "testnet" | "mainnet";
  result: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToJobState(row: JobRow): JobState {
  return {
    jobId: row.jobId,
    publicKey: row.publicKey,
    status: row.status,
    totalBatches: row.totalBatches,
    completedBatches: row.completedBatches,
    payments: JSON.parse(row.payments) as PaymentInstruction[],
    signedTransactions: row.signedTransactions ? (JSON.parse(row.signedTransactions) as string[]) : undefined,
    network: row.network,
    result: row.result ? (JSON.parse(row.result) as BatchResult) : undefined,
    error: row.error ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function insertJob(db: Database.Database, args: BatchJobArgs & { jobId: string }): void {
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO jobs (jobId, publicKey, status, totalBatches, completedBatches, payments, signedTransactions, network, createdAt, updatedAt)
    VALUES (?, ?, 'queued', 0, 0, ?, ?, ?, ?, ?)
  `).run(
    args.jobId,
    args.publicKey,
    JSON.stringify(args.payments),
    args.signedTransactions ? JSON.stringify(args.signedTransactions) : null,
    args.network,
    now,
    now,
  );
}

function pruneExpiredIdempotencyKeys(db: Database.Database, nowIso: string): void {
  db.prepare("DELETE FROM idempotency_keys WHERE expiresAt <= ?").run(nowIso);
}

// ---------------------------------------------------------------------------
// Public API  (same surface as the old in-memory store)
// ---------------------------------------------------------------------------

/**
 * Create a new job and return its ID.
 * #300: Supports both payment-based (server-side signed) and pre-signed transaction modes.
 * #337: Persists signedTransactions in the database for recovery after restart.
 */
export function createJob(
  payments: PaymentInstruction[],
  network: "testnet" | "mainnet",
  publicKey: string,
  signedTransactions?: string[],
): string {
  const db = getDb();
  const jobId = crypto.randomUUID();
  insertJob(db, { jobId, payments, network, publicKey, signedTransactions });

  return jobId;
}

export function createIdempotentJob<ResponseBody>(args: {
  idempotencyKey: string;
  requestHash: string;
  payments: PaymentInstruction[];
  network: "testnet" | "mainnet";
  publicKey: string;
  signedTransactions?: string[];
  buildResponseBody: (jobId: string) => ResponseBody;
}): IdempotentJobResult<ResponseBody> {
  const db = getDb();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS).toISOString();

  const run = db.transaction(() => {
    pruneExpiredIdempotencyKeys(db, now);

    const existing = db
      .prepare("SELECT * FROM idempotency_keys WHERE idempotencyKey = ?")
      .get(args.idempotencyKey) as IdempotencyRow | undefined;

    if (existing) {
      if (existing.requestHash !== args.requestHash) {
        throw new IdempotencyConflictError();
      }

      return {
        jobId: existing.jobId,
        responseBody: JSON.parse(existing.responseBody) as ResponseBody,
        replayed: true,
      } satisfies IdempotentJobResult<ResponseBody>;
    }

    const jobId = crypto.randomUUID();
    insertJob(db, {
      jobId,
      payments: args.payments,
      network: args.network,
      publicKey: args.publicKey,
      signedTransactions: args.signedTransactions,
    });

    const responseBody = args.buildResponseBody(jobId);

    db.prepare(`
      INSERT INTO idempotency_keys (idempotencyKey, requestHash, jobId, responseBody, createdAt, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      args.idempotencyKey,
      args.requestHash,
      jobId,
      JSON.stringify(responseBody),
      now,
      expiresAt,
    );

    return {
      jobId,
      responseBody,
      replayed: false,
    } satisfies IdempotentJobResult<ResponseBody>;
  });

  return run();
}

/**
 * Retrieve a job by ID. Returns undefined if not found.
 */
export function getJob(jobId: string, publicKey?: string): JobState | undefined {
  const db = getDb();
  const row = publicKey
    ? db.prepare("SELECT * FROM jobs WHERE jobId = ? AND publicKey = ?").get(jobId, publicKey) as JobRow | undefined
    : db.prepare("SELECT * FROM jobs WHERE jobId = ?").get(jobId) as JobRow | undefined;
  return row ? rowToJobState(row) : undefined;
}

/**
 * Partially update a job's state.
 */
export function updateJob(
  jobId: string,
  patch: Partial<Omit<JobState, "jobId" | "createdAt">>,
): void {
  const db = getDb();
  const row = db.prepare("SELECT * FROM jobs WHERE jobId = ?").get(jobId) as
    | JobRow
    | undefined;
  if (!row) return;

  const now = new Date().toISOString();

  db.prepare(
    `
    UPDATE jobs SET
      status           = ?,
      totalBatches     = ?,
      completedBatches = ?,
      result           = ?,
      error            = ?,
      updatedAt        = ?
    WHERE jobId = ?
  `,
  ).run(
    patch.status ?? row.status,
    patch.totalBatches ?? row.totalBatches,
    patch.completedBatches ?? row.completedBatches,
    patch.result !== undefined ? JSON.stringify(patch.result) : row.result,
    patch.error ?? row.error,
    now,
    jobId,
  );
}

export interface JobQueryFilters {
  status?: JobStatus;
  network?: "testnet" | "mainnet";
  publicKey?: string;
  /** Case-insensitive substring match on jobId, payments JSON, or result JSON. */
  search?: string;
  /** ISO timestamp — include jobs with createdAt >= from. */
  from?: string;
  /** ISO timestamp — include jobs with createdAt <= to. */
  to?: string;
}

function buildJobQueryFilters(opts?: JobQueryFilters): {
  where: string;
  params: (string | number)[];
} {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (opts?.status) {
    conditions.push("status = ?");
    params.push(opts.status);
  }
  if (opts?.network) {
    conditions.push("network = ?");
    params.push(opts.network);
  }
  if (opts?.publicKey) {
    conditions.push("publicKey = ?");
    params.push(opts.publicKey);
  }
  if (opts?.from) {
    conditions.push("createdAt >= ?");
    params.push(opts.from);
  }
  if (opts?.to) {
    conditions.push("createdAt <= ?");
    params.push(opts.to);
  }
  if (opts?.search?.trim()) {
    const term = `%${escapeLikePattern(opts.search.trim())}%`;
    conditions.push(
      "(jobId LIKE ? ESCAPE '\\' OR COALESCE(result, '') LIKE ? ESCAPE '\\' OR payments LIKE ? ESCAPE '\\')",
    );
    params.push(term, term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

/**
 * Return all jobs ordered by creation time descending (newest first).
 * Accepts optional filters for the batch history endpoint.
 */
export function getAllJobs(opts?: JobQueryFilters & {
  limit?: number;
  offset?: number;
}): JobState[] {
  const db = getDb();
  const { where, params } = buildJobQueryFilters(opts);
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const rows = db
    .prepare(
      `SELECT * FROM jobs ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as JobRow[];

  return rows.map(rowToJobState);
}

// ---------------------------------------------------------------------------
// Idempotency key store
// ---------------------------------------------------------------------------

/**
 * Look up the jobId previously stored for the given idempotency key.
 * Returns undefined when the key is not found or has expired.
 */
export function getJobIdByIdempotencyKey(key: string): string | undefined {
  const db = getDb();
  const row = db
    .prepare("SELECT jobId, createdAt FROM idempotency_keys WHERE key = ?")
    .get(key) as { jobId: string; createdAt: string } | undefined;

  if (!row) return undefined;

  const age = Date.now() - new Date(row.createdAt).getTime();
  if (age > IDEMPOTENCY_TTL_MS) {
    db.prepare("DELETE FROM idempotency_keys WHERE key = ?").run(key);
    return undefined;
  }

  return row.jobId;
}

/**
 * Persist a mapping from idempotency key to jobId.
 * Silently replaces any existing row with the same key (should never happen
 * in normal usage since keys are checked before job creation).
 */
export function storeIdempotencyKey(key: string, jobId: string): void {
  const db = getDb();
  db.prepare(
    "INSERT OR REPLACE INTO idempotency_keys (key, jobId, createdAt) VALUES (?, ?, ?)",
  ).run(key, jobId, new Date().toISOString());
}

/**
 * Return the total count of jobs (optionally filtered).
 */
export function countJobs(opts?: JobQueryFilters): number {
  const db = getDb();
  const { where, params } = buildJobQueryFilters(opts);
  const row = db
    .prepare(`SELECT COUNT(*) as cnt FROM jobs ${where}`)
    .get(...params) as { cnt: number };
  return row.cnt;
}
