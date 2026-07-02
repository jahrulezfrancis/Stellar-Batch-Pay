/**
 * Helpers for verifying that a pre-signed transaction envelope (XDR) is
 * actually owned by the wallet a job is attributed to. (#504)
 *
 * Pre-signed submission modes accept XDRs and attribute the resulting job to a
 * caller-supplied publicKey. Without checking that the transaction's source
 * account matches that publicKey, a client could submit a transaction signed by
 * wallet A while attributing it to wallet B — polluting B's history and
 * bypassing wallet-scoped APIs. These helpers extract the effective source
 * account so callers can reject mismatches.
 */

import {
  TransactionBuilder,
  FeeBumpTransaction,
  Transaction,
  Networks,
} from "stellar-sdk";

export function networkPassphraseFor(network: "testnet" | "mainnet"): string {
  return network === "testnet" ? Networks.TESTNET : Networks.PUBLIC;
}

/**
 * Extract the effective source account of a (possibly fee-bumped) signed
 * transaction envelope.
 *
 * For a fee-bump transaction the *inner* transaction's source is the account
 * whose funds actually move, so that — not the fee source — is the account a
 * job should be attributed to. Returns `undefined` when the envelope cannot be
 * parsed or the source cannot be determined (e.g. in mocked test doubles), so
 * callers can decide whether to skip or reject.
 */
export function getXdrSourceAccount(
  xdr: string,
  network: "testnet" | "mainnet",
): string | undefined {
  let tx: Transaction | FeeBumpTransaction;
  try {
    tx = TransactionBuilder.fromXDR(xdr, networkPassphraseFor(network));
  } catch {
    return undefined;
  }

  const source =
    tx instanceof FeeBumpTransaction
      ? tx.innerTransaction.source
      : (tx as Transaction).source;

  return typeof source === "string" && source.length > 0 ? source : undefined;
}

/**
 * Count the operations contained in a parsed transaction envelope. (#512)
 *
 * Pre-signed batches encode one Stellar operation per recipient, so the
 * operation count is the source of truth for success/failure attribution —
 * not the length of any out-of-band `payments` array, which can be empty
 * (pure XDR submit, #300) or misaligned with the envelope's real ops.
 *
 * For a fee-bump transaction the inner transaction holds the operations.
 * Returns `undefined` when the count cannot be determined (e.g. mocked test
 * doubles without an `operations` array) so callers can fall back.
 */
export function operationCountOf(
  tx: Transaction | FeeBumpTransaction,
): number | undefined {
  const ops =
    tx instanceof FeeBumpTransaction
      ? tx.innerTransaction.operations
      : (tx as Transaction).operations;

  return Array.isArray(ops) ? ops.length : undefined;
}

export interface SourceMismatch {
  index: number;
  source: string;
}

/**
 * Find the first signed XDR whose source account does not match the expected
 * public key. Envelopes whose source cannot be determined are skipped (the
 * primary submit-time gate parses fully; this keeps best-effort, defense-in-
 * depth callers from failing on test doubles or already-rejected garbage).
 * Returns `null` when every determinable source matches.
 */
export function findSourceMismatch(
  signedTransactions: string[],
  expectedPublicKey: string,
  network: "testnet" | "mainnet",
): SourceMismatch | null {
  for (let i = 0; i < signedTransactions.length; i++) {
    const source = getXdrSourceAccount(signedTransactions[i], network);
    if (source !== undefined && source !== expectedPublicKey) {
      return { index: i, source };
    }
  }
  return null;
}
