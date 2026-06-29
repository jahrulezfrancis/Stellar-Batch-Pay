import { describe, expect, test } from 'vitest';
import {
  DAY_IN_LEDGERS,
  DEFAULT_BUMP_THRESHOLD_DAYS,
  daysToLedgers,
  ledgersToDays,
  prioritizeRecipients,
  readPositiveIntEnv,
  shouldBumpForTtl,
} from '../lib/keeper/threshold';

describe('keeper threshold helpers (#332)', () => {
  test('DAY_IN_LEDGERS mirrors the on-chain constant', () => {
    expect(DAY_IN_LEDGERS).toBe(17_280);
  });

  test('default threshold matches contract BUMP_THRESHOLD', () => {
    expect(DEFAULT_BUMP_THRESHOLD_DAYS).toBe(7);
    expect(daysToLedgers(DEFAULT_BUMP_THRESHOLD_DAYS)).toBe(7 * DAY_IN_LEDGERS);
  });

  test('readPositiveIntEnv falls back when unset or empty', () => {
    expect(readPositiveIntEnv(undefined, 7, 'X')).toBe(7);
    expect(readPositiveIntEnv('', 7, 'X')).toBe(7);
  });

  test('readPositiveIntEnv parses valid values', () => {
    expect(readPositiveIntEnv('3', 7, 'X')).toBe(3);
    expect(readPositiveIntEnv('30', 7, 'X')).toBe(30);
  });

  test('readPositiveIntEnv rejects zero, negatives, and non-integers', () => {
    expect(() => readPositiveIntEnv('0', 7, 'BUMP_THRESHOLD_DAYS')).toThrow(/positive integer/);
    expect(() => readPositiveIntEnv('-1', 7, 'BUMP_THRESHOLD_DAYS')).toThrow(/positive integer/);
    expect(() => readPositiveIntEnv('1.5', 7, 'BUMP_THRESHOLD_DAYS')).toThrow(/positive integer/);
    expect(() => readPositiveIntEnv('abc', 7, 'BUMP_THRESHOLD_DAYS')).toThrow(/positive integer/);
  });

  test('daysToLedgers and ledgersToDays round-trip whole days', () => {
    expect(ledgersToDays(daysToLedgers(7))).toBe(7);
    expect(ledgersToDays(daysToLedgers(30))).toBe(30);
  });
});

describe('shouldBumpForTtl', () => {
  const currentLedger = 1_000_000;
  const thresholdLedgers = 7 * DAY_IN_LEDGERS;

  test('bumps when liveUntil is inside the threshold window', () => {
    const liveUntilLedger = currentLedger + thresholdLedgers - 1;
    expect(
      shouldBumpForTtl({ liveUntilLedger, currentLedger, thresholdLedgers }),
    ).toBe(true);
  });

  test('bumps when liveUntil equals current + threshold (boundary)', () => {
    const liveUntilLedger = currentLedger + thresholdLedgers;
    expect(
      shouldBumpForTtl({ liveUntilLedger, currentLedger, thresholdLedgers }),
    ).toBe(true);
  });

  test('skips when TTL is comfortably beyond the threshold', () => {
    const liveUntilLedger = currentLedger + thresholdLedgers + DAY_IN_LEDGERS;
    expect(
      shouldBumpForTtl({ liveUntilLedger, currentLedger, thresholdLedgers }),
    ).toBe(false);
  });

  test('bumps when liveUntil is unknown (missing ledger entry)', () => {
    expect(
      shouldBumpForTtl({ liveUntilLedger: null, currentLedger, thresholdLedgers }),
    ).toBe(true);
  });

  test('bumps when entry has already expired', () => {
    const liveUntilLedger = currentLedger - 1;
    expect(
      shouldBumpForTtl({ liveUntilLedger, currentLedger, thresholdLedgers }),
    ).toBe(true);
  });
});

describe('prioritizeRecipients', () => {
  const currentLedger = 1_000_000;
  const thresholdLedgers = 7 * DAY_IN_LEDGERS;

  test('returns empty list when every recipient is healthy', () => {
    const healthy = [
      { recipient: 'G_A', liveUntilLedger: currentLedger + 30 * DAY_IN_LEDGERS },
      { recipient: 'G_B', liveUntilLedger: currentLedger + 14 * DAY_IN_LEDGERS },
    ];
    expect(prioritizeRecipients(healthy, currentLedger, thresholdLedgers)).toEqual([]);
  });

  test('filters out recipients comfortably above threshold and sorts by urgency', () => {
    const mixed = [
      { recipient: 'G_HEALTHY', liveUntilLedger: currentLedger + 30 * DAY_IN_LEDGERS },
      { recipient: 'G_DUE_IN_5D', liveUntilLedger: currentLedger + 5 * DAY_IN_LEDGERS },
      { recipient: 'G_DUE_IN_1D', liveUntilLedger: currentLedger + 1 * DAY_IN_LEDGERS },
      { recipient: 'G_UNKNOWN', liveUntilLedger: null },
    ];
    const result = prioritizeRecipients(mixed, currentLedger, thresholdLedgers);
    expect(result.map((s) => s.recipient)).toEqual([
      'G_UNKNOWN',
      'G_DUE_IN_1D',
      'G_DUE_IN_5D',
    ]);
  });

  test('expired entries sort ahead of about-to-expire entries', () => {
    const snapshots = [
      { recipient: 'G_FUTURE', liveUntilLedger: currentLedger + DAY_IN_LEDGERS },
      { recipient: 'G_EXPIRED', liveUntilLedger: currentLedger - 100 },
    ];
    const result = prioritizeRecipients(snapshots, currentLedger, thresholdLedgers);
    expect(result.map((s) => s.recipient)).toEqual(['G_EXPIRED', 'G_FUTURE']);
  });
});
