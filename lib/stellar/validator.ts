/**
 * Validation utilities for payment instructions and configuration
 */

import { StrKey } from 'stellar-sdk';

import { PaymentInstruction, BatchConfig, HorizonBalance, BalancesMap, BalanceValidationResult } from './types';

function isValidPublicKey(value: string): boolean {
  return StrKey.isValidEd25519PublicKey(value);
}

function isValidSecretSeed(value: string): boolean {
  return StrKey.isValidEd25519SecretSeed(value);
}

export function validatePaymentInstruction(instruction: PaymentInstruction): { valid: boolean; error?: string } {
  if (!instruction.address || typeof instruction.address !== 'string') {
    return { valid: false, error: 'Invalid address: must be a non-empty string' };
  }

  if (!isValidPublicKey(instruction.address)) {
    return { valid: false, error: `Invalid Stellar address checksum: ${instruction.address}` };
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
  if (!isValidPublicKey(issuer)) {
    return { valid: false, error: `Invalid issuer address checksum in asset: ${issuer}` };
  }

  if (code.length > 12) {
    return { valid: false, error: `Invalid asset code length: ${code}` };
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

  if (!isValidSecretSeed(config.secretKey)) {
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

/**
 * Build a lookup map from a Horizon account's balances array.
 * Native XLM is keyed as "XLM"; non-native assets as "CODE:ISSUER".
 */
export function buildBalancesMap(balances: HorizonBalance[]): BalancesMap {
  const map: BalancesMap = {};
  for (const entry of balances) {
    const key = entry.asset_type === 'native'
      ? 'XLM'
      : `${entry.asset_code}:${entry.asset_issuer}`;
    map[key] = Number(entry.balance);
  }
  return map;
}

/**
 * Resolve the asset key used in the balances map for a payment instruction.
 */
export function resolveAssetKey(asset: string): string {
  return asset === 'XLM' ? 'XLM' : asset; // already in "CODE:ISSUER" format
}

/**
 * Validate that the source account has sufficient balance for every asset
 * across all payment instructions. Multiple payments of the same asset are
 * aggregated so cumulative spend is checked.
 */
export function validateBalances(
  instructions: PaymentInstruction[],
  balancesMap: BalancesMap,
): BalanceValidationResult {
  // Aggregate required amounts per asset
  const requiredByAsset: Record<string, number> = {};
  for (const instruction of instructions) {
    const key = resolveAssetKey(instruction.asset);
    requiredByAsset[key] = (requiredByAsset[key] ?? 0) + Number(instruction.amount);
  }

  const checks = [];
  let allSufficient = true;

  for (const [assetKey, required] of Object.entries(requiredByAsset)) {
    const available = balancesMap[assetKey] ?? 0; // missing trustline → zero
    const sufficient = available >= required;
    if (!sufficient) allSufficient = false;
    checks.push({ asset_key: assetKey, required, available, sufficient });
  }

  return { all_sufficient: allSufficient, checks };
}
