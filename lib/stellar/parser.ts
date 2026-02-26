/**
 * Parser for converting JSON and CSV inputs to payment instructions
 */

import Papa from 'papaparse';
import { PaymentInstruction } from './types';
import { validatePaymentInstruction } from './validator';

export function parseJSON(content: string): PaymentInstruction[] {
  try {
    const data = JSON.parse(content);

    // Handle both array and object with payments property
    const instructions = Array.isArray(data) ? data : data.payments;

    if (!Array.isArray(instructions)) {
      throw new Error('Expected an array of payment instructions or object with "payments" array');
    }

    return instructions;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function parseCSV(content: string): PaymentInstruction[] {
  const lines = content.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const addressIndex = headers.indexOf('address');
  const amountIndex = headers.indexOf('amount');
  const assetIndex = headers.indexOf('asset');

  if (addressIndex === -1 || amountIndex === -1 || assetIndex === -1) {
    throw new Error('CSV must have "address", "amount", and "asset" columns');
  }

  const instructions: PaymentInstruction[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue; // Skip empty lines

    const parts = line.split(',').map(p => p.trim());

    if (parts.length < Math.max(addressIndex, amountIndex, assetIndex) + 1) {
      throw new Error(`Row ${i + 1} has insufficient columns`);
    }

    instructions.push({
      address: parts[addressIndex],
      amount: parts[amountIndex],
      asset: parts[assetIndex],
    });
  }

  if (instructions.length === 0) {
    throw new Error('No valid payment instructions found in CSV');
  }

  return instructions;
}

export function parseInput(content: string, format: 'json' | 'csv'): PaymentInstruction[] {
  if (format === 'json') {
    return parseJSON(content);
  } else if (format === 'csv') {
    return parseCSV(content);
  } else {
    throw new Error(`Unknown format: ${format}`);
  }
}

export function parseFileStream(
  file: File,
  callbacks: {
    onProgress?: (count: number) => void;
    onComplete: (payments: PaymentInstruction[]) => void;
    onError: (error: Error) => void;
  }
) {
  const instructions: PaymentInstruction[] = [];
  let rowCount = 0;
  let aborted = false;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase(),
    chunk: (results, parser) => {
      if (aborted) return;
      const data = results.data as Record<string, unknown>[];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];

        const instruction: PaymentInstruction = {
          address: String(row.address || '').trim(),
          amount: String(row.amount || '').trim(),
          asset: String(row.asset || '').trim(),
        };

        if (!instruction.address || !instruction.amount || !instruction.asset) {
          aborted = true;
          parser.abort();
          callbacks.onError(new Error(`Row ${rowCount + i + 1} has insufficient columns: requires address, amount, asset`));
          return;
        }

        const validation = validatePaymentInstruction(instruction);
        if (!validation.valid) {
          aborted = true;
          parser.abort();
          callbacks.onError(new Error(`Row ${rowCount + i + 1}: ${validation.error}`));
          return;
        }

        instructions.push(instruction);
      }

      rowCount += data.length;
      if (callbacks.onProgress) {
        callbacks.onProgress(rowCount);
      }
    },
    error: (error: Error) => {
      if (aborted) return;
      aborted = true;
      callbacks.onError(new Error(`CSV Parse Error: ${error.message}`));
    },
    complete: () => {
      if (aborted) return;

      if (instructions.length === 0) {
        callbacks.onError(new Error('No valid payment instructions found in CSV'));
      } else {
        callbacks.onComplete(instructions);
      }
    }
  });
}
