"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { horizonService } from "@/services/horizon";
import pLimit from "p-limit";

export type TrustlineCheckResult = {
  address: string;
  hasTrustline: boolean;
};

export type TrustlineCacheScope = {
  network?: string;
  assetCode?: string;
  assetIssuer?: string;
};

export type TrustlineRefetchOptions = {
  forceRefresh?: boolean;
};

// Cache for trustline checks: key = "network:address:assetCode:assetIssuer"
const trustlineCache = new Map<string, TrustlineCheckResult>();

export function getCacheKey(
  address: string,
  assetCode: string,
  assetIssuer?: string,
  network = "testnet",
): string {
  const normalizedAssetCode = assetCode.trim() || "native";
  const normalizedAssetIssuer = assetIssuer?.trim() || "native";
  return `${network}:${address}:${normalizedAssetCode}:${normalizedAssetIssuer}`;
}

export function getCachedTrustlineResult(
  address: string,
  assetCode: string,
  assetIssuer?: string,
  network = "testnet",
  options?: TrustlineRefetchOptions,
): TrustlineCheckResult | undefined {
  if (options?.forceRefresh) {
    return undefined;
  }

  return trustlineCache.get(getCacheKey(address, assetCode, assetIssuer, network));
}

export function cacheTrustlineResult(
  address: string,
  assetCode: string,
  assetIssuer: string | undefined,
  network: string,
  result: TrustlineCheckResult,
): void {
  trustlineCache.set(getCacheKey(address, assetCode, assetIssuer, network), result);
}

export function clearTrustlineCache(scope?: TrustlineCacheScope): void {
  if (!scope) {
    trustlineCache.clear();
    return;
  }

  const { network, assetCode, assetIssuer } = scope;
  const normalizedAssetIssuer = assetIssuer?.trim() || "native";

  for (const key of Array.from(trustlineCache.keys())) {
    const parts = key.split(":");
    const [keyNetwork, , keyAssetCode, keyAssetIssuer] = parts;
    const matchesNetwork = !network || keyNetwork === network;
    const matchesAssetCode = !assetCode || keyAssetCode === assetCode;
    const matchesAssetIssuer =
      !assetIssuer || keyAssetIssuer === normalizedAssetIssuer;

    if (matchesNetwork && matchesAssetCode && matchesAssetIssuer) {
      trustlineCache.delete(key);
    }
  }
}

export function useTrustlines(assetCode: string, assetIssuer?: string) {
  const { publicKey, network } = useWallet();
  const [results, setResults] = useState<TrustlineCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedNetwork =
    network === "testnet" || network === "mainnet" ? network : "testnet";

  useEffect(() => {
    clearTrustlineCache({
      network: normalizedNetwork,
      assetCode,
      assetIssuer,
    });
  }, [assetCode, assetIssuer, normalizedNetwork]);

  const checkTrustlines = useCallback(
    async (addresses: string[], options?: TrustlineRefetchOptions) => {
      if (!publicKey || !network || addresses.length === 0) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const server = horizonService.getServer(normalizedNetwork);

        const limit = pLimit(10);

        const checkPromises = addresses.map((address) =>
          limit(async () => {
            const cachedResult = getCachedTrustlineResult(
              address,
              assetCode,
              assetIssuer,
              normalizedNetwork,
              options,
            );

            if (cachedResult) {
              return cachedResult;
            }

            try {
              const account = await server.loadAccount(address);
              const hasTrustline = account.balances.some(
                (balance: {
                  asset_type: string;
                  asset_code?: string;
                  asset_issuer?: string;
                }) =>
                  balance.asset_type !== "native" &&
                  balance.asset_type !== "liquidity_pool_shares" &&
                  balance.asset_code === assetCode &&
                  balance.asset_issuer === assetIssuer,
              );
              const result: TrustlineCheckResult = { address, hasTrustline };
              cacheTrustlineResult(
                address,
                assetCode,
                assetIssuer,
                normalizedNetwork,
                result,
              );
              return result;
            } catch (err) {
              console.warn(`Failed to load account ${address}:`, err);
              const result: TrustlineCheckResult = {
                address,
                hasTrustline: false,
              };
              cacheTrustlineResult(
                address,
                assetCode,
                assetIssuer,
                normalizedNetwork,
                result,
              );
              return result;
            }
          }),
        );

        const results = await Promise.all(checkPromises);
        setResults(results);
      } catch (err) {
        console.error("Failed to check trustlines:", err);
        setError(
          err instanceof Error ? err.message : "Failed to check trustlines",
        );
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [assetCode, assetIssuer, normalizedNetwork, publicKey, network],
  );

  const refetch = useCallback(
    (addresses: string[], options?: TrustlineRefetchOptions) => {
      void checkTrustlines(addresses, options);
    },
    [checkTrustlines],
  );

  return { results, loading, error, refetch };
}
