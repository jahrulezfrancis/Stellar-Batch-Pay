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

// ---------------------------------------------------------------------------
// DB initialisation
// ---------------------------------------------------------------------------

const DB_PATH =
  process.env.JOB_STORE_PATH ?? path.join(process.cwd(), "data", "jobs.db");

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
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO jobs (jobId, publicKey, status, totalBatches, completedBatches, payments, signedTransactions, network, createdAt, updatedAt)
    VALUES (?, ?, 'queued', 0, 0, ?, ?, ?, ?, ?)
  `).run(
    jobId, 
    publicKey, 
    JSON.stringify(payments), 
    signedTransactions ? JSON.stringify(signedTransactions) : null,
    network, 
    now, 
    now
  );

  return jobId;
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

/**
 * Return all jobs ordered by creation time descending (newest first).
 * Accepts optional filters for the batch history endpoint.
 */
export function getAllJobs(opts?: {
  limit?: number;
  offset?: number;
  status?: JobStatus;
  network?: "testnet" | "mainnet";
  publicKey?: string;
}): JobState[] {
  const db = getDb();

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

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  params.push(limit, offset);

  const rows = db
    .prepare(
      `SELECT * FROM jobs ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    )
    .all(...params) as JobRow[];

  return rows.map(rowToJobState);
}

/**
 * Return the total count of jobs (optionally filtered).
 */
export function countJobs(opts?: {
  status?: JobStatus;
  network?: "testnet" | "mainnet";
  publicKey?: string;
}): number {
  const db = getDb();

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

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const row = db
    .prepare(`SELECT COUNT(*) as cnt FROM jobs ${where}`)
    .get(...params) as { cnt: number };
  return row.cnt;
}
