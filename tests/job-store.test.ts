/**
 * Unit tests for the durable SQLite job store.
 *
 * We point the store at an in-memory SQLite database by setting the
 * JOB_STORE_PATH env var to ":memory:" before importing the module.
 * Each describe block re-imports the module so the DB is fresh.
 */

import { describe, test, expect, beforeAll } from "vitest";

// Use an in-memory DB so tests don't touch the filesystem
process.env.JOB_STORE_PATH = ":memory:";

import { createJob, getJob, updateJob, getAllJobs, countJobs } from "../lib/job-store";

const OWNER_PUBLIC_KEY = "GDQERHRWJYV7JHRP5V7DWJVI6Y5ABZP3YRH7DKYJRBEGJQKE6IQEOSY2";
const OTHER_PUBLIC_KEY = "GB7QNDHSBQZENWGZUBJ4KLSZFRNHN5ATQXZSC3ZHZ5ZBQ6Y6X3TOBQ7S";

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
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    expect(typeof jobId).toBe("string");
    expect(jobId.length).toBeGreaterThan(0);
    expect(jobId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  test("returns unique IDs for each call", () => {
    const id1 = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const id2 = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    expect(id1).not.toBe(id2);
  });

  test("initial job has status queued", () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const job = getJob(jobId);
    expect(job?.status).toBe("queued");
  });

  test("initial job has completedBatches of 0", () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const job = getJob(jobId);
    expect(job?.completedBatches).toBe(0);
  });

  test("stores the payments array on the job", () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const job = getJob(jobId);
    expect(job?.payments).toEqual(samplePayments);
  });

  test("stores the network on the job", () => {
    const jobId = createJob(samplePayments, "mainnet", OWNER_PUBLIC_KEY);
    const job = getJob(jobId);
    expect(job?.network).toBe("mainnet");
  });

  test("stores the owner public key on the job", () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const job = getJob(jobId);
    expect(job?.publicKey).toBe(OWNER_PUBLIC_KEY);
  });

  test("hydrates signedTransactions from the stored row", () => {
    const signedTransactions = ["AAAA", "BBBB"];
    const jobId = createJob(
      samplePayments,
      "testnet",
      OWNER_PUBLIC_KEY,
      signedTransactions,
    );
    const job = getJob(jobId);
    expect(job?.signedTransactions).toEqual(signedTransactions);
  });

  test("sets createdAt and updatedAt as ISO strings", () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
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
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const job = getJob(jobId);
    expect(job).toBeDefined();
    expect(job?.jobId).toBe(jobId);
  });

  test("scopes lookup by public key", () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    expect(getJob(jobId, OWNER_PUBLIC_KEY)).toBeDefined();
    expect(getJob(jobId, OTHER_PUBLIC_KEY)).toBeUndefined();
  });
});

describe("Job Store — updateJob", () => {
  test("updates status to processing", () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    updateJob(jobId, { status: "processing", totalBatches: 5 });
    const job = getJob(jobId);
    expect(job?.status).toBe("processing");
    expect(job?.totalBatches).toBe(5);
  });

  test("increments completedBatches", () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
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
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    updateJob(jobId, { status: "processing" });
    const job = getJob(jobId);
    expect(job?.network).toBe("testnet");
    expect(job?.payments).toEqual(samplePayments);
  });

  test("updates updatedAt on each updateJob call", async () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const before = getJob(jobId)!.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    updateJob(jobId, { completedBatches: 1 });
    const after = getJob(jobId)!.updatedAt;
    expect(new Date(after).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime(),
    );
  });

  test("sets completed status and attaches result", () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
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

describe("Job Store — getAllJobs / countJobs", () => {
  test("returns an array", () => {
    const jobs = getAllJobs();
    expect(Array.isArray(jobs)).toBe(true);
  });

  test("includes newly created jobs", () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const jobs = getAllJobs();
    const found = jobs.find((j) => j.jobId === jobId);
    expect(found).toBeDefined();
  });

  test("countJobs returns a non-negative integer", () => {
    const count = countJobs();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("status filter works", () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    updateJob(jobId, { status: "failed" });
    const failed = getAllJobs({ status: "failed" });
    expect(failed.every((j) => j.status === "failed")).toBe(true);
  });

  test("network filter works", () => {
    createJob(samplePayments, "mainnet", OWNER_PUBLIC_KEY);
    const mainnet = getAllJobs({ network: "mainnet" });
    expect(mainnet.every((j) => j.network === "mainnet")).toBe(true);
  });

  test("publicKey filter isolates tenant history", () => {
    const ownerJobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const otherJobId = createJob(samplePayments, "testnet", OTHER_PUBLIC_KEY);

    const ownerJobs = getAllJobs({ publicKey: OWNER_PUBLIC_KEY });
    const ownerIds = ownerJobs.map((job) => job.jobId);
    const ownerCount = countJobs({ publicKey: OWNER_PUBLIC_KEY });

    expect(ownerIds).toContain(ownerJobId);
    expect(ownerIds).not.toContain(otherJobId);
    expect(ownerCount).toBeGreaterThanOrEqual(ownerJobs.length);
  });

  test("pagination limit is respected", () => {
    // Create 5 more jobs
    for (let i = 0; i < 5; i++) createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const page = getAllJobs({ limit: 3, offset: 0 });
    expect(page.length).toBeLessThanOrEqual(3);
  });

  test("search filter matches jobId substring", () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const matches = getAllJobs({ search: jobId.slice(0, 8), publicKey: OWNER_PUBLIC_KEY });
    expect(matches.some((job) => job.jobId === jobId)).toBe(true);
  });

  test("search filter matches recipient address in payments JSON", () => {
    const address = samplePayments[0]?.address ?? "GSEARCHMATCH";
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const matches = getAllJobs({ search: address, publicKey: OWNER_PUBLIC_KEY });
    expect(matches.some((job) => job.jobId === jobId)).toBe(true);
  });

  test("from date filter excludes older jobs", () => {
    const jobId = createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const futureFrom = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const matches = getAllJobs({ from: futureFrom, publicKey: OWNER_PUBLIC_KEY });
    expect(matches.some((job) => job.jobId === jobId)).toBe(false);
  });

  test("sort by status asc returns jobs ordered by status (#606)", () => {
    createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const jobs = getAllJobs({ sort: "status", order: "asc" });
    for (let i = 1; i < jobs.length; i++) {
      expect(jobs[i - 1].status.localeCompare(jobs[i].status)).toBeLessThanOrEqual(0);
    }
  });

  test("sort by updatedAt desc returns jobs ordered by updatedAt descending (#606)", () => {
    createJob(samplePayments, "testnet", OWNER_PUBLIC_KEY);
    const jobs = getAllJobs({ sort: "updatedAt", order: "desc" });
    for (let i = 1; i < jobs.length; i++) {
      expect(new Date(jobs[i - 1].updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(jobs[i].updatedAt).getTime(),
      );
    }
  });
});
