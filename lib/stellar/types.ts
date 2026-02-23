/**
 * Type definitions for the Stellar bulk payment system
 */

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
  status: 'success' | 'failed';
  transactionHash?: string;
  error?: string;
}

export interface BatchResult {
  batchId: string;
  totalRecipients: number;
  totalAmount: string;
  totalTransactions: number;
  network: 'testnet' | 'mainnet';
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
  network: 'testnet' | 'mainnet';
  secretKey: string;
}
