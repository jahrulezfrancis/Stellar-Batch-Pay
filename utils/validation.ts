/**
 * Validation utilities for UI state and transaction safety.
 */

import { PaymentInstruction, BalancesMap } from '@/lib/stellar';
import { validateBatchForSubmit } from '@/lib/stellar/validator';
import { AssetAmount } from './aggregateAssets';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that a batch can be submitted given balances and trustlines.
 * This is used before enabling the submit button.
 */
export function validateBatchSubmission(
  payments: PaymentInstruction[],
  balances: AssetAmount[],
  missingTrustlines: string[], // addresses missing trustlines for the asset
  selectedNetwork: 'testnet' | 'mainnet',
): ValidationResult {
  const balancesMap: BalancesMap = {};
  for (const bal of balances) {
    balancesMap[bal.asset] = Number(bal.total);
  }

  return validateBatchForSubmit(
    payments,
    balancesMap,
    missingTrustlines,
    selectedNetwork
  );
}

/**
 * Validate that a transaction will not exceed network limits.
 */
export function validateTransactionSize(payments: PaymentInstruction[], maxOperations: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (payments.length > maxOperations) {
    errors.push(`Batch size (${payments.length}) exceeds maximum operations per transaction (${maxOperations}).`);
  }

  // TODO: add size estimation using batcher functions

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Sanitize and normalize payment instruction for submission.
 */
export function normalizePayment(instruction: PaymentInstruction): PaymentInstruction {
  return {
    address: instruction.address.trim(),
    amount: instruction.amount.trim(),
    asset: instruction.asset.trim(),
    memo: instruction.memo?.trim(),
    memoType: instruction.memoType,
  };
}
