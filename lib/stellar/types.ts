/**
 * Type definitions for the Stellar bulk payment system
 */

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface JobState {
  jobId: string;
  status: JobStatus;
  totalBatches: number;
  completedBatches: number;
  payments: PaymentInstruction[];
  network: "testnet" | "mainnet";
  result?: BatchResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInstruction {
  address: string;
  amount: string;
  asset: string; // 'XLM' for native or 'CODE:ISSUER' for issued assets
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
}

export interface BatchResult {
  batchId: string;
  totalRecipients: number;
  totalAmount: string;
  totalTransactions: number;
  network: "testnet" | "mainnet";
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
  network: "testnet" | "mainnet";
  secretKey: string;
}

/** Config for building unsigned transactions (wallet-signing flow) */
export interface BuildBatchConfig {
  maxOperationsPerTransaction: number;
  network: "testnet" | "mainnet";
  publicKey: string;
}

/** Result from the batch-build endpoint (unsigned XDRs) */
export interface BuildBatchResult {
  xdrs: string[];
  batchCount: number;
  network: "testnet" | "mainnet";
  publicKey: string;
}
