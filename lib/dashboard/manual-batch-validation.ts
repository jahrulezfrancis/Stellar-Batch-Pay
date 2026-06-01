import { StrKey } from "stellar-sdk";
import { validatePaymentInstruction } from "@/lib/stellar/validator";
import type { PaymentInstruction } from "@/lib/stellar/types";

/** Returns an inline error message when the address fails checksum validation. */
export function validateManualAddress(address: string): string | undefined {
  const trimmed = address.trim();
  if (!trimmed) return undefined;
  if (!StrKey.isValidEd25519PublicKey(trimmed)) {
    return "Invalid Stellar address checksum";
  }
  return undefined;
}

export function rowHasContent(row: Partial<PaymentInstruction>): boolean {
  return Boolean(row.address?.trim() || row.amount?.trim() || row.asset?.trim());
}

export function getValidManualPayments(
  rows: Partial<PaymentInstruction>[],
): PaymentInstruction[] {
  return rows.filter((row) => {
    if (!row.address || !row.amount || !row.asset) return false;
    return validatePaymentInstruction(row as PaymentInstruction).valid;
  }) as PaymentInstruction[];
}

/** True when every non-empty row is complete and valid, with at least one valid payment. */
export function canContinueManualBatch(rows: Partial<PaymentInstruction>[]): boolean {
  const filled = rows.filter(rowHasContent);
  if (filled.length === 0) return false;
  return (
    getValidManualPayments(filled).length > 0 &&
    filled.every((row) => {
      if (!row.address || !row.amount || !row.asset) return false;
      return validatePaymentInstruction(row as PaymentInstruction).valid;
    })
  );
}
