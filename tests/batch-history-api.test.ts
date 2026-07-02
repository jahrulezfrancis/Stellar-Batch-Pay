/**
 * HTTP-level tests for GET /api/batch-history
 */

import { describe, expect, test, vi } from "vitest";

vi.hoisted(() => {
  process.env.JOB_STORE_PATH = ":memory:";
});

import { NextRequest } from "next/server";
import { Keypair } from "stellar-sdk";
import { createJob, updateJob } from "@/lib/job-store";

import { GET } from "@/app/api/batch-history/route";

const samplePayments = [
  {
    address: "GBBD47UZM2HN7D7XZIZVG4KVAUC36THN5BES6RMNNOK5TUNXAUCVMAKER",
    amount: "100",
    asset: "XLM",
  },
];

function makeRequest(params: Record<string, string | undefined>) {
  const url = new URL("http://localhost/api/batch-history");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

describe("GET /api/batch-history", () => {
  test("returns 400 when publicKey is missing", async () => {
    const res = await GET(makeRequest({} as any) as never);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/publicKey/i);
  });

  test("returns 400 when publicKey is invalid", async () => {
    const res = await GET(makeRequest({ publicKey: "not-a-key" }) as never);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/publicKey/i);
  });

  test("paginates items and returns pagination metadata", async () => {
    const OWNER = Keypair.random();

    // Seed 5 jobs for OWNER
    for (let i = 0; i < 5; i++) {
      const jobId = createJob(samplePayments, "testnet", OWNER.publicKey());
      updateJob(jobId, { status: "completed", totalBatches: 1, completedBatches: 1 });
    }

    const res = await GET(
      makeRequest({ publicKey: OWNER.publicKey(), page: "1", limit: "2" }) as never,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.items).toHaveLength(2);
    expect(json.pagination).toEqual(
      expect.objectContaining({ page: 1, limit: 2, total: 5, totalPages: 3 }),
    );
    expect(json.aggregateMetrics).toBeDefined();
  });

  test("filters by status and network", async () => {
    const OWNER = Keypair.random();

    const completedId = createJob(samplePayments, "testnet", OWNER.publicKey());
    updateJob(completedId, {
      status: "completed",
      totalBatches: 2,
      completedBatches: 2,
      result: {
        batchId: completedId,
        totalRecipients: 1,
        totalAmount: "200",
        totalTransactions: 2,
        network: "testnet",
        timestamp: new Date().toISOString(),
        results: [],
        summary: { successful: 1, failed: 0 },
      },
    });

    const failedId = createJob(samplePayments, "testnet", OWNER.publicKey());
    updateJob(failedId, {
      status: "failed",
      totalBatches: 2,
      completedBatches: 0,
      error: "boom",
    });

    const mainnetId = createJob(samplePayments, "mainnet", OWNER.publicKey());
    updateJob(mainnetId, { status: "completed", totalBatches: 1, completedBatches: 1 });

    const res = await GET(
      makeRequest({ publicKey: OWNER.publicKey(), status: "completed", network: "testnet" }) as never,
    );
    const json = await res.json();

    expect(res.status).toBe(200);

    const ids = json.items.map((x: any) => x.jobId);
    expect(ids).toContain(completedId);
    expect(ids).not.toContain(failedId);
    expect(ids).not.toContain(mainnetId);

    for (const item of json.items) {
      expect(item.status).toBe("completed");
      expect(item.network).toBe("testnet");
    }
  });

  test("filters by date range and search term", async () => {
    const OWNER = Keypair.random();

    const matchingId = createJob(
      [
        {
          ...samplePayments[0],
          amount: "25",
        },
      ],
      "testnet",
      OWNER.publicKey(),
    );
    updateJob(matchingId, {
      status: "completed",
      totalBatches: 1,
      completedBatches: 1,
      result: {
        batchId: matchingId,
        totalRecipients: 1,
        totalAmount: "25",
        totalTransactions: 1,
        network: "testnet",
        timestamp: new Date().toISOString(),
        results: [
          {
            recipient: samplePayments[0].address,
            amount: "25",
            asset: "XLM",
            status: "success",
            transactionHash: "unique-search-token",
          },
        ],
        summary: { successful: 1, failed: 0 },
      },
    });

    const excludedId = createJob(samplePayments, "testnet", OWNER.publicKey());
    updateJob(excludedId, { status: "completed", totalBatches: 1, completedBatches: 1 });

    const from = new Date(Date.now() - 60_000).toISOString();
    const to = new Date(Date.now() + 60_000).toISOString();
    const res = await GET(
      makeRequest({
        publicKey: OWNER.publicKey(),
        from,
        to,
        search: "unique-search-token",
      }) as never,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.items.map((item: any) => item.jobId)).toEqual([matchingId]);
    expect(json.items.map((item: any) => item.jobId)).not.toContain(excludedId);
    expect(json.pagination.total).toBe(1);
  });

  test("tenant isolation: does not leak other users jobs", async () => {
    const OWNER = Keypair.random();
    const OTHER = Keypair.random();

    const ownerJobId = createJob(samplePayments, "testnet", OWNER.publicKey());
    updateJob(ownerJobId, { status: "processing", totalBatches: 1, completedBatches: 0 });

    const otherJobId = createJob(samplePayments, "testnet", OTHER.publicKey());
    updateJob(otherJobId, { status: "completed", totalBatches: 1, completedBatches: 1 });

    const res = await GET(makeRequest({ publicKey: OWNER.publicKey() }) as never);
    const json = await res.json();

    const ids = json.items.map((x: any) => x.jobId);
    expect(ids).toContain(ownerJobId);
    expect(ids).not.toContain(otherJobId);
  });

  test("response shape includes required fields", async () => {
    const OWNER = Keypair.random();

    const jobId = createJob(samplePayments, "testnet", OWNER.publicKey());
    updateJob(jobId, { status: "queued", totalBatches: 0, completedBatches: 0 });

    const res = await GET(
      makeRequest({ publicKey: OWNER.publicKey(), limit: "1", page: "1" }) as never,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.items).toHaveLength(1);

    const item = json.items[0];
    expect(item).toEqual(
      expect.objectContaining({
        jobId,
        status: expect.any(String),
        network: expect.any(String),
        totalBatches: expect.any(Number),
        completedBatches: expect.any(Number),
        totalPayments: expect.any(Number),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
    expect(item).toHaveProperty("summary");
    expect(item).toHaveProperty("totalAmount");
  });
});
