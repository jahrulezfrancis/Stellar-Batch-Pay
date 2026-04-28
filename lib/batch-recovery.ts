/**
 * Batch recovery utilities for resuming failed operations (#276)
 *
 * Provides helpers to:
 * - Save batch state to IndexedDB after submission
 * - Retrieve failed operations for retry
 * - Mark operations as completed after successful retry
 */

import { PaymentInstruction, PaymentResult } from './stellar/types';
import { saveBatch, loadBatch, updateTxStatus, PersistedBatch, PersistedTx } from './batch-persistence';

export interface FailedBatchState {
  jobId: string;
  network: 'testnet' | 'mainnet';
  totalPayments: number;
  failedOperations: PaymentInstruction[];
  failedResults: PaymentResult[];
  lastError?: string;
}

/**
 * Save batch results to IndexedDB for recovery purposes.
 * Tracks successful and failed transactions so users can resume on failure.
 */
export async function saveBatchForRecovery(
  jobId: string,
  network: 'testnet' | 'mainnet',
  payments: PaymentInstruction[],
  results: PaymentResult[],
): Promise<void> {
  // Build transaction records from successful results
  const txMap = new Map<string, PersistedTx>();
  let txIndex = 0;

  for (const result of results) {
    if (result.status === 'success' && result.transactionHash) {
      // Group by transaction hash (multiple payments per tx)
      if (!txMap.has(result.transactionHash)) {
        txMap.set(result.transactionHash, {
          hash: result.transactionHash,
          batchIndex: txIndex++,
          recipientCount: 0,
          status: 'confirmed',
          submittedAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString(),
        });
      }
      const tx = txMap.get(result.transactionHash);
      if (tx) tx.recipientCount++;
    }
  }

  const batch: PersistedBatch = {
    jobId,
    createdAt: new Date().toISOString(),
    network,
    totalPayments: payments.length,
    transactions: Array.from(txMap.values()),
  };

  await saveBatch(batch);
}

/**
 * Load a batch from IndexedDB and extract the operations that need retry.
 */
export async function loadFailedBatchOperations(
  jobId: string,
  originalPayments: PaymentInstruction[],
  previousResults: PaymentResult[],
): Promise<FailedBatchState | null> {
  const batch = await loadBatch(jobId);
  if (!batch) return null;

  // Map successful transaction hashes to payment instructions
  const successfulRecipients = new Set<string>();
  for (const result of previousResults) {
    if (result.status === 'success') {
      successfulRecipients.add(result.recipient);
    }
  }

  // Extract failed operations (those not in successful results)
  const failedOperations = originalPayments.filter(
    (payment) => !successfulRecipients.has(payment.address)
  );

  // Extract failed results for reference
  const failedResults = previousResults.filter((r) => r.status === 'failed');

  return {
    jobId,
    network: batch.network,
    totalPayments: batch.totalPayments,
    failedOperations,
    failedResults,
  };
}

/**
 * Check if a batch can be resumed (has pending or failed transactions).
 */
export async function canResumeBatch(jobId: string): Promise<boolean> {
  const batch = await loadBatch(jobId);
  if (!batch) return false;

  // Check if any transactions are pending or failed
  const pendingOrFailed = batch.transactions.filter(
    (tx) => tx.status !== 'confirmed'
  );

  return pendingOrFailed.length > 0;
}

/**
 * Mark a transaction as having failed again during retry, for re-attempt tracking.
 */
export async function markTransactionFailed(
  jobId: string,
  transactionHash: string,
): Promise<void> {
  await updateTxStatus(jobId, transactionHash, 'failed');
}

/**
 * Mark a transaction as confirmed after successful retry.
 */
export async function markTransactionConfirmed(
  jobId: string,
  transactionHash: string,
): Promise<void> {
  await updateTxStatus(jobId, transactionHash, 'confirmed', new Date().toISOString());
}
