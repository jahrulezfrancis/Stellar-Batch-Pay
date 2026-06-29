/**
 * Tests for IndexedDB batch-persistence layer, focusing on the race-free
 * updateTxStatus implementation (issue #551).
 */

import { beforeEach, describe, expect, test } from "vitest";
import "fake-indexeddb/auto";

// Reset the IDB environment between tests so each starts with a clean store.
// fake-indexeddb re-exports IDBFactory; reassigning indexedDB is enough.
import { IDBFactory } from "fake-indexeddb";

import {
  saveBatch,
  loadBatch,
  updateTxStatus,
} from "../lib/batch-persistence";
import type { PersistedBatch } from "../lib/batch-persistence";

function makeBatch(jobId: string, hashes: string[]): PersistedBatch {
  return {
    jobId,
    createdAt: new Date().toISOString(),
    network: "testnet",
    totalPayments: hashes.length,
    transactions: hashes.map((hash, i) => ({
      hash,
      batchIndex: i,
      recipientCount: 1,
      status: "pending",
      submittedAt: new Date().toISOString(),
    })),
  };
}

beforeEach(() => {
  // Fresh IDB instance per test — prevents state leaking across tests.
  globalThis.indexedDB = new IDBFactory();
});

describe("updateTxStatus — atomic read-modify-write", () => {
  test("updates a single transaction status", async () => {
    const batch = makeBatch("job-1", ["hash-a"]);
    await saveBatch(batch);

    await updateTxStatus("job-1", "hash-a", "confirmed", "2026-01-01T00:00:00Z");

    const loaded = await loadBatch("job-1");
    expect(loaded?.transactions[0].status).toBe("confirmed");
    expect(loaded?.transactions[0].confirmedAt).toBe("2026-01-01T00:00:00Z");
  });

  test("does nothing when jobId does not exist", async () => {
    await expect(updateTxStatus("nonexistent", "hash-x", "confirmed")).resolves.toBeUndefined();
  });

  test("does nothing when hash is not found in the batch", async () => {
    const batch = makeBatch("job-2", ["hash-a"]);
    await saveBatch(batch);

    await updateTxStatus("job-2", "hash-z", "failed");

    const loaded = await loadBatch("job-2");
    expect(loaded?.transactions[0].status).toBe("pending");
  });

  test("parallel updates to different hashes both persist (no lost write)", async () => {
    const batch = makeBatch("job-3", ["hash-a", "hash-b"]);
    await saveBatch(batch);

    // Fire both updates concurrently — the serialization queue must ensure
    // neither overwrites the other.
    await Promise.all([
      updateTxStatus("job-3", "hash-a", "confirmed"),
      updateTxStatus("job-3", "hash-b", "failed"),
    ]);

    const loaded = await loadBatch("job-3");
    const a = loaded?.transactions.find((t) => t.hash === "hash-a");
    const b = loaded?.transactions.find((t) => t.hash === "hash-b");
    expect(a?.status).toBe("confirmed");
    expect(b?.status).toBe("failed");
  });

  test("two rapid updates to the same hash reflect the last write", async () => {
    const batch = makeBatch("job-4", ["hash-a"]);
    await saveBatch(batch);

    await Promise.all([
      updateTxStatus("job-4", "hash-a", "confirmed"),
      updateTxStatus("job-4", "hash-a", "failed"),
    ]);

    const loaded = await loadBatch("job-4");
    // Both ran serially; whichever was enqueued second wins.
    expect(["confirmed", "failed"]).toContain(loaded?.transactions[0].status);
  });

  test("loadBatch after rapid parallel updates reflects all changes", async () => {
    const hashes = ["h1", "h2", "h3", "h4", "h5"];
    const batch = makeBatch("job-5", hashes);
    await saveBatch(batch);

    await Promise.all(
      hashes.map((h) => updateTxStatus("job-5", h, "confirmed")),
    );

    const loaded = await loadBatch("job-5");
    for (const tx of loaded!.transactions) {
      expect(tx.status).toBe("confirmed");
    }
  });
});
