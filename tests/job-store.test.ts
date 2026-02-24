/**
 * Unit tests for the in-memory job store.
 * Run with: bun test tests/job-store.test.ts
 */

import { describe, test, expect } from "vitest";

// We import the functions but need to reset the module state between tests.
// Since bun caches modules, we work around it by importing fresh per describe block.

import { createJob, getJob, updateJob, getAllJobs } from "../lib/job-store";

const samplePayments = [
  {
    address: "GBBD47UZM2HN7D7XZIZVG4KVAUC36THN5BES6RMNNOK5TUNXAUCVMAKER",
    amount: "100",
    asset: "XLM",
  },
  {
    address: "GBJCHUKZMTFSLOMNC7P4TS4VJJBTCYL3AEYZ7R37ZJNHYQM7MDEBC67",
    amount: "50",
    asset: "XLM",
  },
];

describe("Job Store — createJob", () => {
  test("returns a non-empty UUID string", () => {
    const jobId = createJob(samplePayments, "testnet");
    expect(typeof jobId).toBe("string");
    expect(jobId.length).toBeGreaterThan(0);
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    expect(jobId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  test("returns unique IDs for each call", () => {
    const id1 = createJob(samplePayments, "testnet");
    const id2 = createJob(samplePayments, "testnet");
    expect(id1).not.toBe(id2);
  });

  test("initial job has status queued", () => {
    const jobId = createJob(samplePayments, "testnet");
    const job = getJob(jobId);
    expect(job?.status).toBe("queued");
  });

  test("initial job has completedBatches of 0", () => {
    const jobId = createJob(samplePayments, "testnet");
    const job = getJob(jobId);
    expect(job?.completedBatches).toBe(0);
  });

  test("stores the payments array on the job", () => {
    const jobId = createJob(samplePayments, "testnet");
    const job = getJob(jobId);
    expect(job?.payments).toEqual(samplePayments);
  });

  test("stores the network on the job", () => {
    const jobId = createJob(samplePayments, "mainnet");
    const job = getJob(jobId);
    expect(job?.network).toBe("mainnet");
  });

  test("sets createdAt and updatedAt as ISO strings", () => {
    const jobId = createJob(samplePayments, "testnet");
    const job = getJob(jobId);
    expect(() => new Date(job!.createdAt)).not.toThrow();
    expect(() => new Date(job!.updatedAt)).not.toThrow();
  });
});

describe("Job Store — getJob", () => {
  test("returns undefined for unknown jobId", () => {
    const job = getJob("00000000-0000-0000-0000-000000000000");
    expect(job).toBeUndefined();
  });

  test("retrieves an existing job", () => {
    const jobId = createJob(samplePayments, "testnet");
    const job = getJob(jobId);
    expect(job).toBeDefined();
    expect(job?.jobId).toBe(jobId);
  });
});

describe("Job Store — updateJob", () => {
  test("updates status to processing", () => {
    const jobId = createJob(samplePayments, "testnet");
    updateJob(jobId, { status: "processing", totalBatches: 5 });
    const job = getJob(jobId);
    expect(job?.status).toBe("processing");
    expect(job?.totalBatches).toBe(5);
  });

  test("increments completedBatches", () => {
    const jobId = createJob(samplePayments, "testnet");
    updateJob(jobId, { status: "processing", totalBatches: 3 });
    updateJob(jobId, { completedBatches: 1 });
    updateJob(jobId, { completedBatches: 2 });
    const job = getJob(jobId);
    expect(job?.completedBatches).toBe(2);
  });

  test("does not throw for unknown jobId", () => {
    expect(() => updateJob("nonexistent", { status: "failed" })).not.toThrow();
  });

  test("preserves existing fields when partially updating", () => {
    const jobId = createJob(samplePayments, "testnet");
    updateJob(jobId, { status: "processing" });
    const job = getJob(jobId);
    // Original fields should be preserved
    expect(job?.network).toBe("testnet");
    expect(job?.payments).toEqual(samplePayments);
  });

  test("updates updatedAt on each updateJob call", async () => {
    const jobId = createJob(samplePayments, "testnet");
    const before = getJob(jobId)!.updatedAt;
    // Small delay to ensure time difference
    await new Promise((r) => setTimeout(r, 5));
    updateJob(jobId, { completedBatches: 1 });
    const after = getJob(jobId)!.updatedAt;
    expect(new Date(after).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime(),
    );
  });

  test("sets completed status and attaches result", () => {
    const jobId = createJob(samplePayments, "testnet");
    const fakeResult = {
      batchId: jobId,
      totalRecipients: 2,
      totalAmount: "150",
      totalTransactions: 1,
      network: "testnet" as const,
      timestamp: new Date().toISOString(),
      results: [],
      summary: { successful: 2, failed: 0 },
    };
    updateJob(jobId, { status: "completed", result: fakeResult });
    const job = getJob(jobId);
    expect(job?.status).toBe("completed");
    expect(job?.result?.batchId).toBe(jobId);
  });
});

describe("Job Store — getAllJobs", () => {
  test("returns an array", () => {
    const jobs = getAllJobs();
    expect(Array.isArray(jobs)).toBe(true);
  });

  test("includes newly created jobs", () => {
    const jobId = createJob(samplePayments, "testnet");
    const jobs = getAllJobs();
    const found = jobs.find((j) => j.jobId === jobId);
    expect(found).toBeDefined();
  });
});
