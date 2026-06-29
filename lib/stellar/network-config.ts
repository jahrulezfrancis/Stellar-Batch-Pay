/**
 * Network-config helpers (#272).
 *
 * Resolves Horizon and Soroban RPC URLs from environment variables so
 * deployments can point at dedicated RPC providers (QuickNode,
 * ValidationCloud, etc.) without a code change. Falls back to the
 * public SDF nodes when no env var is set so local dev keeps working
 * out of the box.
 *
 * Env vars (server + client safe):
 *   HORIZON_URL_TESTNET   default: https://horizon-testnet.stellar.org
 *   HORIZON_URL_MAINNET   default: https://horizon.stellar.org
 *   HORIZON_URL_FUTURENET default: https://horizon-futurenet.stellar.org
 *   SOROBAN_RPC_URL_TESTNET default: https://soroban-testnet.stellar.org
 *   SOROBAN_RPC_URL_MAINNET default: https://soroban-mainnet.stellar.org
 *   SOROBAN_RPC_URL_FUTURENET default: https://soroban-futurenet.stellar.org
 *
 * Client-side bundles need the `NEXT_PUBLIC_` prefix; if either name
 * is set, the public-prefixed one wins (lets server overrides differ
 * from what the browser sees if that's ever desired).
 */

export type Network = "testnet" | "mainnet" | "futurenet";

const DEFAULTS = {
  horizon: {
    testnet: "https://horizon-testnet.stellar.org",
    mainnet: "https://horizon.stellar.org",
    futurenet: "https://horizon-futurenet.stellar.org",
  },
  rpc: {
    testnet: "https://soroban-testnet.stellar.org",
    mainnet: "https://soroban-mainnet.stellar.org",
    futurenet: "https://soroban-futurenet.stellar.org",
  },
} as const;

function pickEnv(...names: string[]): string | undefined {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

export function horizonUrl(network: Network): string {
  switch (network) {
    case "mainnet":
      return (
        pickEnv("NEXT_PUBLIC_HORIZON_URL_MAINNET", "HORIZON_URL_MAINNET") ??
        DEFAULTS.horizon.mainnet
      );
    case "futurenet":
      return (
        pickEnv("NEXT_PUBLIC_HORIZON_URL_FUTURENET", "HORIZON_URL_FUTURENET") ??
        DEFAULTS.horizon.futurenet
      );
    case "testnet":
    default:
      return (
        pickEnv("NEXT_PUBLIC_HORIZON_URL_TESTNET", "HORIZON_URL_TESTNET") ??
        DEFAULTS.horizon.testnet
      );
  }
}

export function sorobanRpcUrl(network: Network): string {
  switch (network) {
    case "mainnet":
      return (
        pickEnv(
          "NEXT_PUBLIC_SOROBAN_RPC_URL_MAINNET",
          "SOROBAN_RPC_URL_MAINNET",
        ) ?? DEFAULTS.rpc.mainnet
      );
    case "futurenet":
      return (
        pickEnv(
          "NEXT_PUBLIC_SOROBAN_RPC_URL_FUTURENET",
          "SOROBAN_RPC_URL_FUTURENET",
        ) ?? DEFAULTS.rpc.futurenet
      );
    case "testnet":
    default:
      return (
        pickEnv(
          "NEXT_PUBLIC_SOROBAN_RPC_URL_TESTNET",
          "SOROBAN_RPC_URL_TESTNET",
        ) ?? DEFAULTS.rpc.testnet
      );
  }
}
