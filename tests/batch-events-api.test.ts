/**
 * HTTP-level tests for GET /api/batch-events/:jobId (SSE)
 */

import { describe, expect, test, vi } from "vitest";

vi.hoisted(() => {
  process.env.JOB_STORE_PATH = ":memory:";
  process.env.BATCH_EVENTS_POLL_INTERVAL_MS = "10";
});

import { NextRequest } from "next/server";
import { Keypair } from "stellar-sdk";
import { createJob, updateJob } from "@/lib/job-store";

import { GET } from "@/app/api/batch-events/[jobId]/route";

vi.mock("@/lib/api-rate-limit", () => ({
  applyRateLimit: vi.fn(() => ({
    blocked: false,
    response: undefined,
    remaining: 99,
    limit: 100,
    resetAt: Date.now() + 60_000,
  })),
}));

const samplePayments = [
  {
    address: "GBBD47UZM2HN7D7XZIZVG4KVAUC36THN5BES6RMNNOK5TUNXAUCVMAKER",
    amount: "100",
    asset: "XLM",
  },
];

function makeReq(url: string) {
  return new NextRequest(url);
}

async function collectSseText(
  res: Response,
  opts?: { timeoutMs?: number },
) {
  const reader = res.body?.getReader();
  expect(reader).toBeTruthy();

  const decoder = new TextDecoder();
  let text = "";
  const timeoutMs = opts?.timeoutMs ?? 1000;

  while (true) {
    const read = reader!.read();
    const timeout = new Promise<ReadableStreamReadResult<Uint8Array>>((_, reject) => {
      setTimeout(() => reject(new Error("Timed out waiting for SSE chunk")), timeoutMs);
    });
    const { done, value } = await Promise.race([read, timeout]);
    if (done) break;

    text += decoder.decode(value, { stream: true });
  }

  return text;
}

describe("GET /api/batch-events/:jobId", () => {
  test("returns 400 when publicKey is missing", async () => {
    const jobId = "any-job";
    const req = makeReq(`http://localhost/api/batch-events/${jobId}`);

    const res = await GET(req as never, { params: Promise.resolve({ jobId }) } as never);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/publicKey/i);
  });

  test("returns 400 when publicKey is invalid", async () => {
    const jobId = "any-job";
    const req = makeReq(`http://localhost/api/batch-events/${jobId}?publicKey=bad`);

    const res = await GET(req as never, { params: Promise.resolve({ jobId }) } as never);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/publicKey/i);
  });

  test("sends SSE frames and closes on completed terminal state", async () => {
    const OWNER = Keypair.random();

    const jobId = createJob(samplePayments, "testnet", OWNER.publicKey());
    updateJob(jobId, { status: "processing", totalBatches: 2, completedBatches: 0 });

    const req = makeReq(
      `http://localhost/api/batch-events/${jobId}?publicKey=${encodeURIComponent(OWNER.publicKey())}`,
    );
    const res = await GET(req as never, { params: Promise.resolve({ jobId }) } as never);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/event-stream/i);

    // Move job to terminal shortly after the SSE request starts.
    setTimeout(() => {
      updateJob(jobId, {
        status: "completed",
        totalBatches: 2,
        completedBatches: 2,
        result: {
          batchId: jobId,
          totalRecipients: 1,
          totalAmount: "100",
          totalTransactions: 1,
          network: "testnet",
          timestamp: new Date().toISOString(),
          results: [],
          summary: { successful: 1, failed: 0 },
        },
      });
    }, 0);

    const sseText = await collectSseText(res);

    expect(sseText).toContain("data:");
    expect(sseText).toContain('"status":"processing"');
    expect(sseText).toContain('"status":"completed"');
    expect(sseText).toContain("\n\n");
  });

  test("does not leak other user's job (emits error and closes)", async () => {
    const OWNER = Keypair.random();
    const OTHER = Keypair.random();

    const otherJobId = createJob(samplePayments, "testnet", OTHER.publicKey());
    updateJob(otherJobId, { status: "processing", totalBatches: 1, completedBatches: 0 });

    const req = makeReq(
      `http://localhost/api/batch-events/${otherJobId}?publicKey=${encodeURIComponent(OWNER.publicKey())}`,
    );
    const res = await GET(req as never, { params: Promise.resolve({ jobId: otherJobId }) } as never);

    const sseText = await collectSseText(res);

    expect(sseText).toMatch(/Job not found/i);
    expect(sseText).toMatch(/"error"/);
    expect(sseText).toContain("\n\n");
  });

  test("unknown job emits an error event and closes", async () => {
    const OWNER = Keypair.random();
    const jobId = "missing-job";
    const req = makeReq(
      `http://localhost/api/batch-events/${jobId}?publicKey=${encodeURIComponent(OWNER.publicKey())}`,
    );

    const res = await GET(req as never, { params: Promise.resolve({ jobId }) } as never);
    const sseText = await collectSseText(res);

    expect(res.status).toBe(200);
    expect(sseText).toMatch(/Job not found: missing-job/i);
    expect(sseText).toMatch(/"error"/);
  });
});
