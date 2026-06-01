/**
 * Server-only utilities for Stellar operations
 * This file is only executed on the server and should never be imported in client components
 */

import {
  Keypair,
  TransactionBuilder,
  Networks,
  Asset as StellarAsset,
  Operation,
  Horizon,
  Memo,
} from "stellar-sdk";

import {
  PaymentInstruction,
  BatchResult,
  PaymentResult,
  BatchConfig,
} from "./types";

import { createBatches } from "./batcher";
import {
  validatePaymentInstruction,
  validateBatchConfig,
} from "./validator";
import { getRecommendedFee } from "./fee-service";
import { isBadSequenceError } from "./submit-errors";
import { horizonUrl } from "./network-config";
import Big from "big.js";
import { parseStellarAmount, formatStellarAmount, parseAsset, truncateMemoToBytes } from "./utils";
export { parseAsset };

export class StellarService {
  private keypair: Keypair;
  private server: Horizon.Server;
  private network: "testnet" | "mainnet";
  private maxOperationsPerTransaction: number;

  constructor(config: BatchConfig) {
    const validation = validateBatchConfig(config);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.keypair = Keypair.fromSecret(config.secretKey);
    this.network = config.network;
    this.maxOperationsPerTransaction = config.maxOperationsPerTransaction;

    this.server = new Horizon.Server(horizonUrl(config.network));
  }

  /**
   * Submit a batch of payments to the Stellar network
   */
  async submitBatch(
    instructions: PaymentInstruction[],
  ): Promise<BatchResult> {
    const results: PaymentResult[] = [];
    const startTime = new Date();

    try {
      // Load source account
      let sourceAccount = await this.server.loadAccount(
        this.keypair.publicKey(),
      );

      // Fetch dynamic fee from Horizon
      const fee = await getRecommendedFee(this.server);

      // Create batches
      const batches = await createBatches(
        instructions,
        this.maxOperationsPerTransaction,
        { network: this.network, server: this.server },
      );

      let txCount = 0;
      let totalAmountBig = new Big(0);

      for (const batch of batches) {
        try {
          // Use user-provided memo from the first payment that has one,
          // otherwise fall back to the system-generated tracking memo.
          // Stellar supports only one memo per transaction.
          const firstMemoPayment = batch.payments.find(p => p.memo);
          let memo: any;
          if (firstMemoPayment?.memo) {
            const memoType = firstMemoPayment.memoType ?? 'text';
            memo = memoType === 'id'
              ? Memo.id(firstMemoPayment.memo)
              : Memo.text(truncateMemoToBytes(firstMemoPayment.memo));
          } else {
            const memoId = `bp-${Date.now()}-${txCount}`;
            memo = Memo.text(truncateMemoToBytes(memoId));
          }

          let builder = new TransactionBuilder(sourceAccount, {
            fee: String(fee),
            networkPassphrase:
              this.network === "testnet"
                ? Networks.TESTNET
                : Networks.PUBLIC,
          }).addMemo(memo);

          for (const payment of batch.payments) {
            const validation = validatePaymentInstruction(payment);

            if (!validation.valid) {
              results.push({
                recipient: payment.address,
                amount: payment.amount,
                asset: payment.asset,
                status: "failed",
                transactionHash: undefined,
                error: validation.error,
                rowIndex: payment.rowIndex,
              });
              continue;
            }

            // Parse Stellar asset correctly
            let asset: StellarAsset;
            try {
              asset = parseAsset(payment.asset);
            } catch (err) {
              results.push({
                recipient: payment.address,
                amount: payment.amount,
                asset: payment.asset,
                status: "failed",
                transactionHash: undefined,
                error: err instanceof Error ? err.message : "Invalid asset",
                rowIndex: payment.rowIndex,
              });
              continue;
            }

            builder = builder.addOperation(
              Operation.payment({
                destination: payment.address,
                asset,
                amount: payment.amount,
              }),
            );

            totalAmountBig = totalAmountBig.plus(parseStellarAmount(payment.amount));

            // Add a placeholder result (status updated after submission)
            results.push({
              recipient: payment.address,
              amount: payment.amount,
              asset: payment.asset,
              status: "failed",
              transactionHash: undefined,
              rowIndex: payment.rowIndex,
            });
          }

          // Build, sign, and submit transaction
          const transaction = builder.setTimeout(300).build();
          transaction.sign(this.keypair);
          const result = await this.server.submitTransaction(transaction);
          sourceAccount.incrementSequenceNumber();

          txCount++;

          // Update successful results
          for (
            let i = results.length - batch.payments.length;
            i < results.length;
            i++
          ) {
            if (results[i].status === "failed") {
              results[i].status = "success";
              results[i].transactionHash = result.hash;
            }
          }
        } catch (error) {
          // Mark batch results as failed if transaction fails
          if (isBadSequenceError(error)) {
            sourceAccount = await this.server.loadAccount(this.keypair.publicKey());
          }

          for (const result of results) {
            if (result.status === "failed") {
              result.error =
                error instanceof Error ? error.message : "Unknown error";
            }
          }
        }
      }

      const endTime = new Date();

      return {
        batchId: `batch-${Date.now()}`,
        totalRecipients: instructions.length,
        totalAmount: formatStellarAmount(totalAmountBig),
        totalTransactions: txCount,
        results,
        summary: {
          successful: results.filter((r) => r.status === "success").length,
          failed: results.filter((r) => r.status === "failed").length,
        },
        timestamp: startTime.toISOString(),
        submittedAt: endTime.toISOString(),
        network: this.network,
      };
    } catch (error) {
      throw new Error(
        `Batch submission failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Get the public key of the account
   */
  getPublicKey(): string {
    return this.keypair.publicKey();
  }
}