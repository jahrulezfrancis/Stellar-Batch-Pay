/**
 * Zod schema for CSV row validation with detailed error messages
 */

import { z } from 'zod';
import { StrKey } from 'stellar-sdk';

const StellarAddressSchema = z
  .string()
  .min(1, 'Address is required')
  .refine(
    (val) => StrKey.isValidEd25519PublicKey(val),
    'Invalid Stellar address (must be a valid public key starting with G)'
  );

const AmountSchema = z
  .string()
  .min(1, 'Amount is required')
  .refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Amount must be a positive number'
  );

const AssetSchema = z
  .string()
  .min(1, 'Asset is required')
  .refine(
    (val) => {
      if (val === 'XLM') return true;
      const parts = val.split(':');
      if (parts.length !== 2) return false;
      const [code, issuer] = parts;
      return (
        code.length > 0 &&
        code.length <= 12 &&
        issuer.length > 0 &&
        StrKey.isValidEd25519PublicKey(issuer)
      );
    },
    'Asset must be XLM or CODE:ISSUER format with valid issuer address'
  );

const MemoTypeSchema = z
  .enum(['text', 'id', 'none'])
  .optional();

const MemoSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const byteLength = new TextEncoder().encode(val).length;
      return byteLength <= 28;
    },
    'Memo text exceeds 28 bytes'
  );

export const CSVRowSchema = z.object({
  address: StellarAddressSchema,
  amount: AmountSchema,
  asset: AssetSchema,
  memo: MemoSchema.optional(),
  memotype: MemoTypeSchema.optional(),
});

export type CSVRow = z.infer<typeof CSVRowSchema>;

export interface CSVValidationError {
  row: number;
  field: string;
  message: string;
}

export interface CSVValidationResult {
  valid: boolean;
  errors: CSVValidationError[];
  validRowCount: number;
  totalRows: number;
}

/**
 * Validate a single CSV row and return detailed error info
 */
export function validateCSVRow(data: Record<string, string>, rowNumber: number): {
  valid: boolean;
  error?: CSVValidationError;
} {
  try {
    CSVRowSchema.parse(data);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return {
        valid: false,
        error: {
          row: rowNumber,
          field: firstIssue.path[0]?.toString() || 'unknown',
          message: firstIssue.message,
        },
      };
    }
    return {
      valid: false,
      error: {
        row: rowNumber,
        field: 'unknown',
        message: 'Validation error',
      },
    };
  }
}

/**
 * Validate all CSV rows and return summary with per-row errors
 */
export function validateCSVData(
  rows: Record<string, string>[],
  startRow: number = 2
): CSVValidationResult {
  const errors: CSVValidationError[] = [];
  let validRowCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = startRow + i;
    const result = validateCSVRow(rows[i], rowNumber);

    if (result.valid) {
      validRowCount++;
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validRowCount,
    totalRows: rows.length,
  };
}
