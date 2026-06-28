# Atomic Job Claiming: Preventing Duplicate Background Workers

This document details the architecture, design decisions, and complexity analysis for resolving the concurrent background worker execution race condition in Stellar BatchPay.

## Problem Description

`processJobInBackground` previously guarded against duplicate execution with a non-atomic read-then-write sequence:

1. Read `job.status` via `getJob(jobId)`.
2. Return early if status was not `queued` or `processing`.
3. Call `updateJob` to set status to `processing` and begin submitting transactions.

The gap between step 1 and step 3 is the race window. Two concurrent invocations triggered by a double POST, an idempotency race, or a retry while the original worker is running can both read `queued` before either has written `processing` to the database. Both workers then proceed past the guard, claim `processing` independently, and submit overlapping sets of Horizon transactions.

The consequence is duplicate or failed Stellar transactions (`TX_BAD_SEQ`), inflated `completedBatches` counters, and incorrect job summaries.

---

## Solution Architecture

The fix introduces a single atomic SQL `UPDATE` at the database layer that combines the status check and the status transition in one operation.

### 1. Atomic Claim Handler (`lib/job-store.ts`)

A new exported function `claimJobForProcessing(jobId: string): boolean` runs this statement:

```sql
UPDATE jobs
SET status = 'processing',
    updatedAt = ?,
    version = version + 1
WHERE jobId = ? AND (
  status = 'queued' OR
  (status = 'processing' AND updatedAt < ?)
)
```

The function returns `result.changes > 0`. Because SQLite serializes all write operations, only one caller can ever have `changes === 1` for a given `jobId` at the same time. Any concurrent caller will find the status already changed and receive `changes === 0`, which maps to a `false` return value.

The `WHERE` clause handles two cases:

- `status = 'queued'`: normal first-time claim.
- `status = 'processing' AND updatedAt < ?`: stale lease reclaim. If a worker crashed mid-job and left the job stranded in `processing`, a later invocation can reclaim it once the lease window expires.

The lease duration is read from `process.env.IDEMPOTENCY_REPLAY_STALE_MS` and defaults to 30 000 ms. This matches the stale threshold already used by the idempotency replay logic in the route handler.

`getDb` is also exported so the stale-claim test can manipulate `updatedAt` directly on the in-memory SQLite instance without requiring a separate helper.

### 2. Guard Integration (`lib/stellar/batch-worker.ts`)

The old non-atomic guard:

```ts
if (job.status !== "queued" && job.status !== "processing") {
  return;
}
```

is replaced with:

```ts
const claimed = claimJobForProcessing(jobId);
if (!claimed) {
  logger.warn({ requestId, jobId, status: job.status },
    "Background worker: Duplicate worker run detected. Job is already claimed, processing, or completed. Exiting early.");
  return;
}
```

If `claimJobForProcessing` returns `false`, the worker exits immediately before any Horizon transaction is attempted. The `logger.warn` call records the duplicate attempt with the `jobId` so it is visible in structured logs.

The `updateJob` calls that follow the claim (setting `totalBatches` and resetting `completedBatches`) remain in place. The claim only transitions the status; the batch metadata is still written by the existing `updateJob` calls once the worker has computed it.

---

## Complexity Analysis

### Time Complexity

- `claimJobForProcessing(jobId)`: **O(1)**. The `WHERE jobId = ?` clause hits the primary key index directly. SQLite locates, locks, and updates the row in constant time regardless of total table size.
- Timestamp comparison in the stale-lease branch: **O(1)**. ISO string lexicographic comparison against a precomputed cutoff timestamp.

### Space Complexity

- `claimJobForProcessing(jobId)`: **O(1)**. No additional in-memory structures. The function creates two string values (`nowIso`, `staleTimeIso`) and reads a single integer (`result.changes`).

---

## Testing Strategy

Three new tests were added to `tests/batch-worker.test.ts` under the describe block `processJobInBackground — concurrent processing guards (#508)`:

1. **Atomic claiming under concurrency**: Creates a job then fires three parallel calls to `claimJobForProcessing` via `Promise.all`. Asserts that exactly one call returns `true` and the other two return `false`.

2. **Stale lease reclaim**: Claims a job, verifies an immediate second claim is rejected, manually sets `updatedAt` to 40 seconds in the past via a direct SQL statement on the test database, then verifies a third claim succeeds.

3. **End-to-end single submission**: Creates a job and fires two parallel `processJobInBackground` calls. Asserts that `mockSubmitTransaction` is called exactly once, confirming only one worker reaches the Horizon submission path.
