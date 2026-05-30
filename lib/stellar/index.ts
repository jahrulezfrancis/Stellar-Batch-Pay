/**
 * Main export file for the Stellar bulk payment library
 * NOTE: StellarService is NOT exported here - use lib/stellar/server.ts server-side only
 */

export { parseInput, parseJSON, parseCSV, parseFileStream, analyzeParsedPayments, parsePaymentFile, MAX_UPLOAD_ROWS } from './parser';
export { createBatches, parseAsset, getBatchSummary } from './batcher';
export { validatePaymentInstruction, validateBatchConfig, validatePaymentInstructions, validateBalances, buildBalancesMap } from './validator';
export { fetchFeeStats, getRecommendedFee, getFeeForOperations, clearFeeCache } from './fee-service';
export type { FeeStats, FeeOptions } from './fee-service';
export type { 
  PaymentInstruction, 
  Asset, 
  StellarTransaction, 
  PaymentResult, 
  BatchResult, 
  BatchConfig, 
  PaymentValidationRow, 
  ParsedPaymentFile,
  HorizonBalance,
  BalancesMap,
  BalanceValidationResult
} from './types';
export { formatAmount } from './utils';
export { buildDepositTransaction, buildClaimTransaction, buildRevokeTransaction, buildBumpInstanceTtlTransaction, buildBumpVestingTtlTransaction } from './vesting';
