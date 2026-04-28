/**
 * Background worker for processing Stellar batch payments asynchronously.
 *
 * Called fire-and-forget from the batch-submit route. Updates job state
 * in the job store so the polling endpoint can track progress.
 *
 * Also persists batch state to IndexedDB to enable recovery of partial failures.
 */

import { StellarService } from "./server";
import { updateJob } from "../job-store";
import { createBatches } from "./batcher";
import type { PaymentInstruction, BatchResult, PaymentResult } from "./types";
import { Horizon } from "stellar-sdk";
import { saveBatchForRecovery } from "../batch-recovery";

/**
 * Process a batch job in the background. This function must NOT be awaited
 * by the caller — it runs asynchronously and updates job state via the store.
 */
export async function processJobInBackground(
  jobId: string,
  payments: PaymentInstruction[],
  network: "testnet" | "mainnet",
  secretKey: string,
): Promise<void> {
  const MAX_OPS = 100;

  try {
    // Create server instance for fee fetching
    const serverUrl = network === 'testnet'
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org';
    const server = new Horizon.Server(serverUrl);

    // Compute batches up-front so we know totalBatches immediately
    const batches = await createBatches(payments, MAX_OPS, { network, server });

    updateJob(jobId, {
      status: "processing",
      totalBatches: batches.length,
      completedBatches: 0,
    });

    const service = new StellarService({
      secretKey,
      network,
      maxOperationsPerTransaction: MAX_OPS,
    });

    const allResults: PaymentResult[] = [];
    let successCount = 0;
    let failCount = 0;
    const startTime = new Date().toISOString();

    // Load account once — StellarService.submitBatch reloads it internally,
    // but the worker drives per-batch processing for incremental progress.
    // We reuse the single-batch submission path from StellarService by calling
    // submitBatch with each batch's payments individually.
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      // Submit this single batch of ≤100 payments as one Stellar transaction
      const batchResult = await service.submitBatch(batch.payments);

      for (const r of batchResult.results) {
        allResults.push(r);
        if (r.status === "success") successCount++;
        else failCount++;
      }

      // Update progress after each batch completes
      updateJob(jobId, { completedBatches: i + 1 });
    }

    const totalAmount = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount),
      0,
    );

    const finalResult: BatchResult = {
      batchId: jobId,
      totalRecipients: payments.length,
      totalAmount: totalAmount.toString(),
      totalTransactions: batches.length,
      network,
      timestamp: startTime,
      submittedAt: new Date().toISOString(),
      results: allResults,
      summary: {
        successful: successCount,
        failed: failCount,
      },
    };

    // Save batch state to IndexedDB for recovery of partial failures
    try {
      await saveBatchForRecovery(jobId, network, payments, allResults);
    } catch (persistError) {
      console.warn('Failed to save batch state for recovery:', persistError);
      // Don't block job completion on persistence failure
    }

    updateJob(jobId, {
      status: "completed",
      result: finalResult,
    });
  } catch (error) {
    updateJob(jobId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown worker error",
    });
  }
}
