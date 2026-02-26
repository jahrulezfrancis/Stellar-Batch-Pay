/**
 * Validation utilities for payment instructions and configuration
 */

import { PaymentInstruction, BatchConfig } from './types';

export function validatePaymentInstruction(instruction: PaymentInstruction): { valid: boolean; error?: string } {
  if (!instruction.address || typeof instruction.address !== 'string') {
    return { valid: false, error: 'Invalid address: must be a non-empty string' };
  }

  // Stellar public keys start with 'G' and are 56 chars (sometimes 57 due to checksum variation)
  if (!/^G[A-Z2-7]{54,56}$/.test(instruction.address)) {
    return { valid: false, error: `Invalid Stellar address format: ${instruction.address}` };
  }

  if (!instruction.amount || typeof instruction.amount !== 'string') {
    return { valid: false, error: 'Invalid amount: must be a non-empty string' };
  }

  // Check if amount is a valid number
  const amount = parseFloat(instruction.amount);
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: `Invalid amount: must be a positive number (got ${instruction.amount})` };
  }

  if (!instruction.asset || typeof instruction.asset !== 'string') {
    return { valid: false, error: 'Invalid asset: must be a non-empty string' };
  }

  // Validate asset format: either 'XLM' or 'CODE:ISSUER'
  if (instruction.asset === 'XLM') {
    return { valid: true };
  }

  const assetParts = instruction.asset.split(':');
  if (assetParts.length !== 2 || assetParts[0].length === 0 || assetParts[1].length === 0) {
    return { valid: false, error: `Invalid asset format: must be 'XLM' or 'CODE:ISSUER' (got ${instruction.asset})` };
  }

  const [code, issuer] = assetParts;
  if (!/^G[A-Z2-7]{54,56}$/.test(issuer)) {
    return { valid: false, error: `Invalid issuer address in asset: ${issuer}` };
  }

  return { valid: true };
}

export function validateBatchConfig(config: BatchConfig): { valid: boolean; error?: string } {
  if (config.maxOperationsPerTransaction < 1 || config.maxOperationsPerTransaction > 100) {
    return { valid: false, error: 'maxOperationsPerTransaction must be between 1 and 100' };
  }

  if (config.network !== 'testnet' && config.network !== 'mainnet') {
    return { valid: false, error: "network must be 'testnet' or 'mainnet'" };
  }

  if (!config.secretKey || typeof config.secretKey !== 'string') {
    return { valid: false, error: 'secretKey must be a non-empty string' };
  }

  // Stellar secret keys start with 'S' and are encoded lengths 56
  if (!/^S[A-Z2-7]{54,56}$/.test(config.secretKey)) {
    return { valid: false, error: 'Invalid Stellar secret key format' };
  }

  return { valid: true };
}

export function validatePaymentInstructions(instructions: PaymentInstruction[]): { valid: boolean; errors: Map<number, string> } {
  const errors = new Map<number, string>();

  for (let i = 0; i < instructions.length; i++) {
    const result = validatePaymentInstruction(instructions[i]);
    if (!result.valid) {
      errors.set(i, result.error || 'Unknown validation error');
    }
  }

  return {
    valid: errors.size === 0,
    errors,
  };
}
