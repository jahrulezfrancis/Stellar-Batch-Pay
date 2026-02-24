/**
 * In-memory job store for async batch processing.
 *
 * Jobs are stored in a module-level Map that persists for the lifetime of the
 * Node.js process. A simple LRU eviction policy (max 100 jobs) prevents
 * unbounded memory growth.
 *
 * To swap in a durable store (Redis, Postgres) in the future, replace the
 * implementations of createJob / getJob / updateJob without changing callers.
 */

import type { JobState, JobStatus, PaymentInstruction } from "./stellar/types";

const MAX_JOBS = 100;
const jobStore = new Map<string, JobState>();

function evictOldestIfNeeded(): void {
  if (jobStore.size >= MAX_JOBS) {
    // Delete the oldest entry (Map iteration order = insertion order)
    const firstKey = jobStore.keys().next().value;
    if (firstKey) jobStore.delete(firstKey);
  }
}

/**
 * Create a new job and return its ID.
 */
export function createJob(
  payments: PaymentInstruction[],
  network: "testnet" | "mainnet",
): string {
  evictOldestIfNeeded();

  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();

  const job: JobState = {
    jobId,
    status: "queued",
    totalBatches: 0, // will be updated by the worker once batches are computed
    completedBatches: 0,
    payments,
    network,
    createdAt: now,
    updatedAt: now,
  };

  jobStore.set(jobId, job);
  return jobId;
}

/**
 * Retrieve a job by ID. Returns undefined if not found.
 */
export function getJob(jobId: string): JobState | undefined {
  return jobStore.get(jobId);
}

/**
 * Partially update a job's state.
 */
export function updateJob(
  jobId: string,
  patch: Partial<Omit<JobState, "jobId" | "createdAt">>,
): void {
  const job = jobStore.get(jobId);
  if (!job) return;

  jobStore.set(jobId, {
    ...job,
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Return all jobs (for debugging / admin purposes).
 */
export function getAllJobs(): JobState[] {
  return Array.from(jobStore.values());
}
