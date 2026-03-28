/**
 * Main Stellar service for building, signing, and submitting transactions
 */

import {
  Account,
  Keypair,
  Transaction,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Asset as StellarAsset,
  Operation,
  Horizon,
} from 'stellar-sdk';

import { PaymentInstruction, BatchResult, PaymentResult, BatchConfig } from './types';
import { parseAsset } from './batcher';
import { validatePaymentInstruction, validateBatchConfig } from './validator';

export class StellarService {
  private keypair: Keypair;
  private server: Horizon.Server;
  private network: 'testnet' | 'mainnet';
  private maxOperationsPerTransaction: number;

  constructor(config: BatchConfig) {
    // Validate configuration
    const validation = validateBatchConfig(config);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.keypair = Keypair.fromSecret(config.secretKey);
    this.network = config.network;
    this.maxOperationsPerTransaction = config.maxOperationsPerTransaction;

    // Initialize Stellar server based on network
    const serverUrl = config.network === 'testnet' 
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org';
    this.server = new Horizon.Server(serverUrl);
  }

  /**
   * Submit a batch of payments to the Stellar network
   */
  async submitBatch(instructions: PaymentInstruction[]): Promise<BatchResult> {
    const results: PaymentResult[] = [];
    const startTime = new Date();

    // Process payments in batches
    const batches = this.createPaymentBatches(instructions);
    let successCount = 0;
    let failCount = 0;

    for (const batch of batches) {
      try {
        // Fetch source account fresh for each batch to avoid sequence collisions
        const sourceAccount = await this.server.loadAccount(this.keypair.publicKey());
        const sequenceNumber = BigInt(sourceAccount.sequenceNumber());

        const transaction = await this.buildTransaction(batch, sequenceNumber);
        const result = await this.submitTransaction(transaction);

        if (result.success) {
          for (const instruction of batch) {
            results.push({
              recipient: instruction.address,
              amount: instruction.amount,
              asset: instruction.asset,
              status: 'success',
              transactionHash: result.transactionHash,
            });
            successCount++;
          }
        } else {
          for (const instruction of batch) {
            results.push({
              recipient: instruction.address,
              amount: instruction.amount,
              asset: instruction.asset,
              status: 'failed',
              error: result.error || 'Transaction failed',
            });
            failCount++;
          }
        }
      } catch (error) {
        for (const instruction of batch) {
          results.push({
            recipient: instruction.address,
            amount: instruction.amount,
            asset: instruction.asset,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          failCount++;
        }
      }
    }

    const totalAmount = instructions.reduce((sum, inst) => sum + parseFloat(inst.amount), 0);

    return {
      batchId: `batch-${startTime.getTime()}`,
      totalRecipients: instructions.length,
      totalAmount: totalAmount.toString(),
      totalTransactions: batches.length,
      network: this.network,
      timestamp: startTime.toISOString(),
      results,
      summary: {
        successful: successCount,
        failed: failCount,
      },
    };
  }

  /**
   * Split payments into batches based on max operations per transaction
   */
  private createPaymentBatches(instructions: PaymentInstruction[]): PaymentInstruction[][] {
    const batches: PaymentInstruction[][] = [];
    let currentBatch: PaymentInstruction[] = [];

    for (const instruction of instructions) {
      // Validate instruction before adding to batch
      const validation = validatePaymentInstruction(instruction);
      if (!validation.valid) {
        throw new Error(`Invalid payment instruction for ${instruction.address}: ${validation.error}`);
      }

      currentBatch.push(instruction);

      if (currentBatch.length >= this.maxOperationsPerTransaction) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  /**
   * Build a Stellar transaction from payment instructions
   */
  private async buildTransaction(
    payments: PaymentInstruction[],
    sequenceNumber: bigint
  ): Promise<Transaction> {
    // Create transaction builder
    const transactionBuilder = new TransactionBuilder(
      new Account(this.keypair.publicKey(), sequenceNumber.toString()),
      {
        fee: BASE_FEE,
        networkPassphrase:
          this.network === 'testnet'
            ? Networks.TESTNET
            : Networks.PUBLIC,
      }
    );

    // Add payment operations
    for (const payment of payments) {
      const asset = parseAsset(payment.asset);

      const stellarAsset =
        asset.issuer === null
          ? StellarAsset.native()
          : new StellarAsset(asset.code, asset.issuer);

      transactionBuilder.addOperation(
        Operation.payment({
          destination: payment.address,
          asset: stellarAsset,
          amount: payment.amount,
        })
      );
    }

    // Set timeout and build transaction
    transactionBuilder.setTimeout(300); // 5 minutes
    const transaction = transactionBuilder.build();

    return transaction;
  }

  /**
   * Sign and submit a transaction to the Stellar network
   */
  private async submitTransaction(
    transaction: Transaction
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    const transactionHash = transaction.hash().toString('hex');

    try {
      // Sign transaction
      transaction.sign(this.keypair);

      // Submit transaction
      const response = await this.server.submitTransaction(transaction);

      if (response.successful) {
        return {
          success: true,
          transactionHash: response.hash,
        };
      } else {
        return {
          success: false,
          transactionHash,
          error: 'Transaction failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        transactionHash,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get the public key of the source account
   */
  getPublicKey(): string {
    return this.keypair.publicKey();
  }
}
