import { accessSync, constants, mkdirSync, writeFileSync, unlinkSync } from "fs";
import path from "path";

export interface PersistenceHealthResult {
  ok: boolean;
  jobStorePath: string;
  rateLimitDbPath: string;
  checks: Array<{ name: string; path: string; ok: boolean; error?: string }>;
}

function resolveJobStorePath(): string {
  return process.env.JOB_STORE_PATH ?? path.join(process.cwd(), "data", "jobs.db");
}

function resolveRateLimitDbPath(): string {
  return (
    process.env.RATE_LIMIT_DB_PATH ??
    path.join(process.cwd(), "data", "rate-limit.db")
  );
}

function checkDirectoryWritable(dbPath: string): { ok: boolean; error?: string } {
  const dir = path.dirname(dbPath);
  try {
    mkdirSync(dir, { recursive: true });
    accessSync(dir, constants.W_OK);
    const probe = path.join(dir, `.write-probe-${process.pid}`);
    writeFileSync(probe, "");
    unlinkSync(probe);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export function checkPersistenceHealth(): PersistenceHealthResult {
  const jobStorePath = resolveJobStorePath();
  const rateLimitDbPath = resolveRateLimitDbPath();

  const jobDir = checkDirectoryWritable(jobStorePath);
  const rateDir = checkDirectoryWritable(rateLimitDbPath);

  const checks = [
    {
      name: "job_store",
      path: jobStorePath,
      ok: jobDir.ok,
      error: jobDir.error,
    },
    {
      name: "rate_limit",
      path: rateLimitDbPath,
      ok: rateDir.ok,
      error: rateDir.error,
    },
  ];

  return {
    ok: checks.every((c) => c.ok),
    jobStorePath,
    rateLimitDbPath,
    checks,
  };
}
