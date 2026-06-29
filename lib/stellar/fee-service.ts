/**
 * Service for fetching and managing dynamic transaction fees from Horizon
 */

import { Horizon, BASE_FEE } from 'stellar-sdk';

export interface FeeStats {
  min: string;
  max: string;
  mode: string;
  p10: string;
  p20: string;
  p30: string;
  p40: string;
  p50: string;
  p60: string;
  p70: string;
  p80: string;
  p90: string;
  p95: string;
  p99: string;
}

export interface FeeOptions {
  /** Multiplier to apply to the fetched fee for safety margin (default: 1.1 = 10% buffer) */
  safetyMultiplier?: number;
  /** Minimum fee to use even if fetched fee is lower (default: BASE_FEE) */
  minFee?: number;
  /** Maximum fee to use even if fetched fee is higher (default: 1000000 = 0.1 XLM) */
  maxFee?: number;
}

const DEFAULT_OPTIONS: Required<FeeOptions> = {
  safetyMultiplier: 1.1,
  minFee: Number(BASE_FEE),
  maxFee: 1000000, // 0.1 XLM as a reasonable upper limit
};

// Cache for fee stats to avoid excessive API calls
// Keyed by server URL to support multiple networks in the same process
const feeStatsCache = new Map<string, { stats: FeeStats; timestamp: number }>();
const CACHE_TTL_MS = 30000; // Cache for 30 seconds

/**
 * Fetch current fee statistics from Horizon server
 */
export async function fetchFeeStats(
  server: Horizon.Server
): Promise<FeeStats> {
  // Create a cache key from server URL
  let serverUrl: string;
  try {
    serverUrl = server.serverURL.toString();
  } catch {
    // Fallback for test mocks or malformed servers
    serverUrl = String(server.serverURL) || 'unknown';
  }
  
  // Return cached stats if still valid
  const cached = feeStatsCache.get(serverUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.stats;
  }

  try {
    const feeStats = await server.feeStats();
    const stats = feeStats as unknown as FeeStats;
    feeStatsCache.set(serverUrl, { stats, timestamp: Date.now() });
    return stats;
  } catch (error) {
    console.warn('Failed to fetch fee stats from Horizon, using BASE_FEE:', error);
    // Return default fee stats based on BASE_FEE if fetch fails
    return {
      min: String(BASE_FEE),
      max: String(BASE_FEE),
      mode: String(BASE_FEE),
      p10: String(BASE_FEE),
      p20: String(BASE_FEE),
      p30: String(BASE_FEE),
      p40: String(BASE_FEE),
      p50: String(BASE_FEE),
      p60: String(BASE_FEE),
      p70: String(BASE_FEE),
      p80: String(BASE_FEE),
      p90: String(BASE_FEE),
      p95: String(BASE_FEE),
      p99: String(BASE_FEE),
    };
  }
}

/**
 * Get the recommended fee with safety margin applied
 * Uses the mode (most common fee) as the base, which is typically the best indicator
 * of what fee will get your transaction included in the next ledger
 */
export async function getRecommendedFee(
  server: Horizon.Server,
  options: FeeOptions = {}
): Promise<number> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const feeStats = await fetchFeeStats(server);
    
    // Use the mode (most common fee) as the base fee
    // This is typically the fee that will get your transaction included
    const baseFee = Number(feeStats.mode);
    
    // Apply safety multiplier
    let recommendedFee = Math.ceil(baseFee * opts.safetyMultiplier);
    
    // Apply min/max constraints
    recommendedFee = Math.max(recommendedFee, opts.minFee);
    recommendedFee = Math.min(recommendedFee, opts.maxFee);
    
    return recommendedFee;
  } catch (error) {
    console.warn('Failed to get recommended fee, using BASE_FEE:', error);
    return opts.minFee;
  }
}

/**
 * Get fee for a specific number of operations
 * The fee is per operation, so multiply by operation count
 */
export async function getFeeForOperations(
  server: Horizon.Server,
  operationCount: number,
  options: FeeOptions = {}
): Promise<number> {
  const feePerOperation = await getRecommendedFee(server, options);
  return feePerOperation * operationCount;
}

/**
 * Clear the fee cache (useful for testing or forcing a refresh)
 */
export function clearFeeCache(): void {
  feeStatsCache.clear();
}
