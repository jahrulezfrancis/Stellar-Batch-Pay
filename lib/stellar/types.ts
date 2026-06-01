/**
 * Type definitions for the Stellar bulk payment system
 */

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type Network = "testnet" | "mainnet" | "futurenet";

export interface JobState {
  jobId: string;
  publicKey: string | null;
  status: JobStatus;
  totalBatches: number;
  completedBatches: number;
  payments: PaymentInstruction[];
  network: Network;
  // #300: Support for pre-signed transactions (client-side signing)
  signedTransactions?: string[];
  result?: BatchResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export type MemoType = "text" | "id" | "none";

export interface PaymentInstruction {
  address: string;
  amount: string;
  asset: string; // 'XLM' for native or 'CODE:ISSUER' for issued assets
  memo?: string;
  memoType?: MemoType; // defaults to 'text' when memo is provided
  rowIndex?: number; // #397: original row index from upload, used for retry matching
}

export interface PaymentValidationRow {
  rowNumber: number;
  instruction: PaymentInstruction;
  valid: boolean;
  isDuplicate?: boolean;
  error?: string;
}

export interface ParsedPaymentFile {
  rows: PaymentValidationRow[];
  validPayments: PaymentInstruction[];
  invalidCount: number;
}

export interface Asset {
  code: string;
  issuer: string | null; // null for native XLM
}

export interface StellarTransaction {
  hash: string;
  operations: number;
}

export interface PaymentResult {
  recipient: string;
  amount: string;
  asset: string;
  status: "success" | "failed";
  transactionHash?: string;
  error?: string;
  rowIndex?: number; // #397: original row index, persisted for retry matching
}

export interface BatchResult {
  batchId: string;
  totalRecipients: number;
  totalAmount: string;
  totalTransactions: number;
  network: Network;
  timestamp: string;
  submittedAt?: string;
  results: PaymentResult[];
  summary: {
    successful: number;
    failed: number;
  };
}

export interface BatchConfig {
  maxOperationsPerTransaction: number;
  network: Network;
  secretKey: string;
}

/** Config for building unsigned transactions (wallet-signing flow) */
export interface BuildBatchConfig {
  maxOperationsPerTransaction: number;
  network: Network;
  publicKey: string;
}

export interface BatchMetaEntry {
  ops: number;
  estimatedBytes: number;
}

/** Result from the batch-build endpoint (unsigned XDRs) */
export interface BuildBatchResult {
  xdrs: string[];
  batchCount: number;
  batchMeta?: BatchMetaEntry[];
  network: Network;
  publicKey: string;
}

/** Vesting data structure matching the smart contract */
export interface VestingData {
  totalAmount: string;
  releasedAmount: string;
  startTime: number;
  endTime: number;
  sender: string;
  token: string;
  recipient: string;
  index: number;
  memo: string;
  vestingStep: number;
  ttlStatus?: "healthy" | "warning" | "expired";
  remainingDays?: number;
}

export type TTLStatus = "healthy" | "warning" | "expired";

// #335: Balance validation types referenced by validator.ts
export interface HorizonBalance {
  balance: string;
  asset_type: "native" | "credit_alphanum4" | "credit_alphanum12";
  asset_code?: string;
  asset_issuer?: string;
}

export interface BalancesMap {
  [assetKey: string]: number;
}

export interface BalanceValidationResult {
  all_sufficient: boolean;
  checks: Array<{
    asset_key: string;
    required: number;
    available: number;
    sufficient: boolean;
    xlm_reserved?: number;
    xlm_available_after_reserve?: number;
  }>;
}
