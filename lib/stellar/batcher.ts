/**
 * Batching logic for chunking payments into multiple transactions
 */

import {
  Account,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
  Horizon,
  rpc as SorobanRpc,
} from "stellar-sdk";
import Big from "big.js";

import { PaymentInstruction, BatchJobNetwork } from "./types";
import { getRecommendedFee } from "./fee-service";
import { parseAsset } from "./utils";
export { getBatchSummary } from "./summary";

export interface Batch {
  transactionIndex: number;
  payments: PaymentInstruction[];
}

export interface CreateBatchesOptions {
  maxTransactionBytes?: number;
  network?: BatchJobNetwork;
  server?: Horizon.Server;
  /** Provide a Soroban RPC server to enable simulation-based size estimation (#218) */
  sorobanServer?: SorobanRpc.Server;
  /** Public key of the source account (required for Soroban simulation) */
  sourcePublicKey?: string;
}

export class BatchMemoConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BatchMemoConflictError";
  }
}

function getPaymentRowNumber(
  payment: PaymentInstruction,
  fallbackIndex: number,
): number {
  return (payment.rowIndex ?? fallbackIndex) + 1;
}

function getMemoSignature(payment: PaymentInstruction): string | undefined {
  if (!payment.memo) {
    return undefined;
  }

  return `${getEffectiveMemoType(payment)}:${payment.memo}`;
}

function formatMemoForError(payment: PaymentInstruction): string {
  return `${getEffectiveMemoType(payment)} memo "${payment.memo}"`;
}

function getEffectiveMemoType(payment: PaymentInstruction): "text" | "id" {
  return payment.memoType === "id" ? "id" : "text";
}

function validateConsistentBatchMemo(
  payments: PaymentInstruction[],
  batchStartIndex: number,
  transactionIndex: number,
): void {
  const memoPayments = payments
    .map((payment, offset) => ({
      payment,
      rowNumber: getPaymentRowNumber(payment, batchStartIndex + offset),
      signature: getMemoSignature(payment),
    }))
    .filter((entry): entry is {
      payment: PaymentInstruction;
      rowNumber: number;
      signature: string;
    } => entry.signature !== undefined);

  if (memoPayments.length <= 1) {
    return;
  }

  const firstMemo = memoPayments[0];
  const conflictingMemos = memoPayments.filter(
    (entry) => entry.signature !== firstMemo.signature,
  );

  if (conflictingMemos.length === 0) {
    return;
  }

  const rows = memoPayments
    .map(
      ({ payment, rowNumber }) =>
        `Row ${rowNumber} has ${formatMemoForError(payment)}`,
    )
    .join("; ");

  throw new BatchMemoConflictError(
    `Conflicting memos in transaction batch ${transactionIndex + 1}: ${rows}. Stellar supports one memo per transaction; rows in the same transaction must use the same memo.`,
  );
}

export const STELLAR_TRANSACTION_SIZE_LIMIT_BYTES = 100_000;
const DEFAULT_TRANSACTION_SIZE_HEADROOM_BYTES = 95_000;
const SIZE_ESTIMATION_ACCOUNT = new Account(
  "GANQYDFSSJMTNLITJNXUPRUIFDVZQK2P4HWSX5CAI4SPIYPXNNFOPZQE",
  "1",
);

/**
 * Use Soroban RPC simulateTransaction to get accurate footprint-aware size (#218).
 * Falls back to static estimation if simulation fails.
 */
export async function simulateBatchTransactionSize(
  payments: PaymentInstruction[],
  network: BatchJobNetwork,
  sorobanServer: SorobanRpc.Server,
  sourcePublicKey: string,
  fee?: number,
): Promise<number> {
  const networkPassphrase =
    network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
  const feeToUse = fee ?? 100;

  try {
    const accountData = await sorobanServer.getAccount(sourcePublicKey);
    const account = new Account(
      accountData.accountId(),
      accountData.sequenceNumber(),
    );

    let builder = new TransactionBuilder(account, {
      fee: String(feeToUse),
      networkPassphrase,
    }).addMemo(Memo.text("batch-size-check"));

    for (const payment of payments) {
      const stellarAsset = parseAsset(payment.asset);

      builder = builder.addOperation(
        Operation.payment({
          destination: payment.address,
          asset: stellarAsset,
          amount: payment.amount,
        }),
      );
    }

    const tx = builder.setTimeout(300).build();
    const simResult = await sorobanServer.simulateTransaction(tx);

    // If simulation succeeds, use the actual XDR size from the prepared transaction
    if (!SorobanRpc.Api.isSimulationError(simResult)) {
      const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
      return getTransactionByteLength(preparedTx.toEnvelope().toXDR());
    }
  } catch {
    // fall through to static estimation
  }

  return estimateBatchTransactionSize(payments, network, fee);
}

function getTransactionByteLength(xdr: string | Buffer): number {
  if (typeof xdr !== "string") {
    return xdr.length;
  }

  return Buffer.from(xdr, "base64").length;
}

export function estimateBatchTransactionSize(
  payments: PaymentInstruction[],
  network: BatchJobNetwork = "testnet",
  fee?: number,
): number {
  const networkPassphrase =
    network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

  // Use provided fee or default to 100 stroops (minimum fee)
  const feeToUse = fee !== undefined ? fee : 100;

  let builder = new TransactionBuilder(SIZE_ESTIMATION_ACCOUNT, {
    fee: String(feeToUse),
    networkPassphrase,
  }).addMemo(Memo.text("batch-size-check"));

  for (const payment of payments) {
    const stellarAsset = parseAsset(payment.asset);

    builder = builder.addOperation(
      Operation.payment({
        destination: payment.address,
        asset: stellarAsset,
        amount: payment.amount,
      }),
    );
  }

  const transaction = builder.setTimeout(300).build();
  return getTransactionByteLength(transaction.toEnvelope().toXDR());
}

/**
 * Split payment instructions into batches based on max operations per transaction
 */
export async function createBatches(
  instructions: PaymentInstruction[],
  maxOperationsPerTransaction: number,
  options: CreateBatchesOptions = {},
): Promise<Batch[]> {
  const batches: Batch[] = [];
  let currentBatch: PaymentInstruction[] = [];
  let currentBatchStartIndex = 0;
  let transactionIndex = 0;
  const maxTransactionBytes =
    options.maxTransactionBytes ?? DEFAULT_TRANSACTION_SIZE_HEADROOM_BYTES;
  const network = options.network ?? "testnet";
  const useSorobanSim = !!(options.sorobanServer && options.sourcePublicKey);

  // Fetch dynamic fee for size estimation
  let dynamicFee: number | undefined;
  if (options.server) {
    try {
      dynamicFee = await getRecommendedFee(options.server);
    } catch (error) {
      console.warn(
        "Failed to fetch dynamic fee for size estimation, using default:",
        error,
      );
    }
  }

  /**
   * Get byte size for a candidate batch — uses Soroban RPC simulation when available (#218),
   * otherwise falls back to static estimation.
   */
  async function getBatchSize(payments: PaymentInstruction[]): Promise<number> {
    if (useSorobanSim) {
      return simulateBatchTransactionSize(
        payments,
        network,
        options.sorobanServer!,
        options.sourcePublicKey!,
        dynamicFee,
      );
    }
    return estimateBatchTransactionSize(payments, network, dynamicFee);
  }

  for (
    let instructionIndex = 0;
    instructionIndex < instructions.length;
    instructionIndex++
  ) {
    const instruction = instructions[instructionIndex];
    const candidateBatch = [...currentBatch, instruction];
    const exceedsOperationLimit =
      candidateBatch.length > maxOperationsPerTransaction;
    const exceedsSizeLimit =
      (await getBatchSize(candidateBatch)) > maxTransactionBytes;

    if (
      (exceedsOperationLimit || exceedsSizeLimit) &&
      currentBatch.length > 0
    ) {
      validateConsistentBatchMemo(
        currentBatch,
        currentBatchStartIndex,
        transactionIndex,
      );
      batches.push({
        transactionIndex,
        payments: currentBatch,
      });
      currentBatch = [];
      transactionIndex++;
    }

    const singleInstructionSize = await getBatchSize([instruction]);
    if (singleInstructionSize > maxTransactionBytes) {
      throw new Error(
        `Payment to ${instruction.address} exceeds the Stellar transaction size limit`,
      );
    }

    if (currentBatch.length === 0) {
      currentBatchStartIndex = instructionIndex;
    }

    currentBatch.push(instruction);
  }

  // Add remaining payments as final batch
  if (currentBatch.length > 0) {
    validateConsistentBatchMemo(
      currentBatch,
      currentBatchStartIndex,
      transactionIndex,
    );
    batches.push({
      transactionIndex,
      payments: currentBatch,
    });
  }

  return batches;
}
