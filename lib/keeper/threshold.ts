/**
 * TTL-threshold helpers for the keeper bot (#332).
 *
 * The on-chain `batch-vesting` contract uses BUMP_THRESHOLD = 7 * DAY_IN_LEDGERS
 * ledgers as the live-until window above which `extend_ttl` becomes a no-op.
 * These helpers let the off-chain keeper decide which recipients are inside
 * that window so we only spend fees on maintenance calls that will actually
 * extend something, and so we prioritize recipients closest to expiry.
 */

/** Soroban targets ~5 second ledgers; this matches `DAY_IN_LEDGERS` in lib.rs. */
export const DAY_IN_LEDGERS = 17_280;

/** Default threshold; mirrors `BUMP_THRESHOLD = 7 * DAY_IN_LEDGERS` in the contract. */
export const DEFAULT_BUMP_THRESHOLD_DAYS = 7;

export type TtlSnapshot = {
  recipient: string;
  /** Soroban liveUntilLedgerSeq, or null when the entry is missing. */
  liveUntilLedger: number | null;
};

/** Parse an unsigned-integer env var with a fallback. */
export function readPositiveIntEnv(
  raw: string | undefined,
  fallback: number,
  name: string,
): number {
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer (got ${JSON.stringify(raw)})`);
  }
  return value;
}

export function daysToLedgers(days: number): number {
  return Math.max(0, Math.floor(days * DAY_IN_LEDGERS));
}

export function ledgersToDays(ledgers: number): number {
  return ledgers / DAY_IN_LEDGERS;
}

/**
 * Returns true when the entry should be bumped — i.e. it expires within the
 * threshold window, or its TTL is unknown (missing entry → bump to be safe).
 */
export function shouldBumpForTtl(args: {
  liveUntilLedger: number | null;
  currentLedger: number;
  thresholdLedgers: number;
}): boolean {
  const { liveUntilLedger, currentLedger, thresholdLedgers } = args;
  if (liveUntilLedger === null) return true;
  const remaining = liveUntilLedger - currentLedger;
  return remaining <= thresholdLedgers;
}

/**
 * Filters recipients to those inside the threshold window and sorts them by
 * urgency (soonest expiry first). Recipients with an unknown TTL are treated
 * as most urgent so the keeper bumps them defensively.
 */
export function prioritizeRecipients(
  snapshots: TtlSnapshot[],
  currentLedger: number,
  thresholdLedgers: number,
): TtlSnapshot[] {
  const urgent = snapshots.filter((s) =>
    shouldBumpForTtl({
      liveUntilLedger: s.liveUntilLedger,
      currentLedger,
      thresholdLedgers,
    }),
  );

  urgent.sort((a, b) => {
    const aRemaining = a.liveUntilLedger === null ? -Infinity : a.liveUntilLedger - currentLedger;
    const bRemaining = b.liveUntilLedger === null ? -Infinity : b.liveUntilLedger - currentLedger;
    return aRemaining - bRemaining;
  });

  return urgent;
}
