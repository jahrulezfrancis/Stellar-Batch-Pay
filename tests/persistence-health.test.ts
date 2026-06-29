import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

describe("checkPersistenceHealth", () => {
  let tempDir: string;
  const previousJobPath = process.env.JOB_STORE_PATH;
  const previousRatePath = process.env.RATE_LIMIT_DB_PATH;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "batchpay-health-"));
    process.env.JOB_STORE_PATH = path.join(tempDir, "jobs.db");
    process.env.RATE_LIMIT_DB_PATH = path.join(tempDir, "rate-limit.db");
  });

  afterEach(() => {
    if (previousJobPath === undefined) {
      delete process.env.JOB_STORE_PATH;
    } else {
      process.env.JOB_STORE_PATH = previousJobPath;
    }
    if (previousRatePath === undefined) {
      delete process.env.RATE_LIMIT_DB_PATH;
    } else {
      process.env.RATE_LIMIT_DB_PATH = previousRatePath;
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("reports ok when database directories are writable", async () => {
    const { checkPersistenceHealth } = await import("../lib/persistence-health");
    const result = checkPersistenceHealth();
    expect(result.ok).toBe(true);
    expect(result.checks.every((check) => check.ok)).toBe(true);
  });
});
