import { beforeEach, describe, expect, test } from "vitest";

import {
  cacheTrustlineResult,
  clearTrustlineCache,
  getCacheKey,
  getCachedTrustlineResult,
} from "../hooks/use-trustlines";

describe("useTrustlines cache", () => {
  beforeEach(() => {
    clearTrustlineCache();
  });

  test("includes the network in the cache key", () => {
    const testnetKey = getCacheKey("GABC", "USDC", "issuer", "testnet");
    const mainnetKey = getCacheKey("GABC", "USDC", "issuer", "mainnet");

    expect(testnetKey).toContain("testnet");
    expect(mainnetKey).toContain("mainnet");
    expect(testnetKey).not.toBe(mainnetKey);
  });

  test("allows a forced refetch to bypass cached results", () => {
    const result = { address: "GABC", hasTrustline: false };
    cacheTrustlineResult("GABC", "USDC", "issuer", "testnet", result);

    expect(
      getCachedTrustlineResult("GABC", "USDC", "issuer", "testnet"),
    ).toEqual(result);
    expect(
      getCachedTrustlineResult("GABC", "USDC", "issuer", "testnet", {
        forceRefresh: true,
      }),
    ).toBeUndefined();
  });

  test("clears matching cache entries when the network or asset changes", () => {
    cacheTrustlineResult("GABC", "USDC", "issuer", "testnet", {
      address: "GABC",
      hasTrustline: false,
    });

    clearTrustlineCache({ network: "testnet", assetCode: "USDC" });

    expect(
      getCachedTrustlineResult("GABC", "USDC", "issuer", "testnet"),
    ).toBeUndefined();
  });
});
