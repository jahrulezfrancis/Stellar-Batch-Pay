/**
 * Regression tests for the dashboard Payment Volume series selection (#518).
 *
 * The main dashboard must render the connected wallet's real volume — never
 * the built-in marketing sample arrays — and fall back to an honest empty
 * state when there is no history yet.
 */

import { describe, expect, test } from "vitest";
import {
  selectVolumeSeries,
  type PaymentVolumePoint,
} from "@/components/dashboard/PaymentVolumeChart";

const live: PaymentVolumePoint[] = [
  { date: "Jun 1", amount: 100 },
  { date: "Jun 2", amount: 250 },
];

describe("selectVolumeSeries (#518)", () => {
  test("returns live data when provided for the range", () => {
    const result = selectVolumeSeries("7d", { "7d": live }, false);
    expect(result).toEqual(live);
  });

  test("returns an empty series (not sample data) when no live data and not previewing", () => {
    expect(selectVolumeSeries("7d", undefined, false)).toEqual([]);
    expect(selectVolumeSeries("30d", { "7d": live }, false)).toEqual([]);
    expect(selectVolumeSeries("7d", { "7d": [] }, false)).toEqual([]);
  });

  test("never returns sample arrays once previewMode is off, even with empty live data", () => {
    for (const range of ["7d", "30d", "90d"] as const) {
      expect(selectVolumeSeries(range, { [range]: [] }, false)).toHaveLength(0);
    }
  });

  test("falls back to sample arrays only in previewMode", () => {
    const result = selectVolumeSeries("7d", undefined, true);
    expect(result.length).toBeGreaterThan(0);
  });

  test("live data wins over sample data even in previewMode", () => {
    const result = selectVolumeSeries("7d", { "7d": live }, true);
    expect(result).toEqual(live);
  });
});
