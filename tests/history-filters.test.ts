import { describe, expect, test } from "vitest";
import { dateRangeToFrom, DEFAULT_HISTORY_FILTERS, parseHistoryFilters } from "../lib/history-filters";

describe("dateRangeToFrom", () => {
  test("returns an ISO timestamp in the past", () => {
    const now = Date.now();
    const from = dateRangeToFrom("7days");
    const parsed = Date.parse(from);
    expect(parsed).toBeLessThan(now);
    expect(now - parsed).toBeGreaterThanOrEqual(6 * 24 * 60 * 60 * 1000);
  });
});

describe("parseHistoryFilters", () => {
  test("falls back to the default filters when the query is empty", () => {
    expect(parseHistoryFilters()).toEqual(DEFAULT_HISTORY_FILTERS);
  });

  test("reads valid search params from the URL", () => {
    const params = new URLSearchParams({
      search: "job-123",
      dateRange: "30days",
      network: "mainnet",
      status: "failed",
    });

    expect(parseHistoryFilters(params)).toEqual({
      search: "job-123",
      dateRange: "30days",
      network: "mainnet",
      status: "failed",
    });
  });

  test("ignores invalid filter values", () => {
    const params = new URLSearchParams({
      search: "  memo keyword  ",
      dateRange: "last-quarter",
      network: "polygon",
      status: "done",
    });

    expect(parseHistoryFilters(params)).toEqual({
      search: "memo keyword",
      dateRange: DEFAULT_HISTORY_FILTERS.dateRange,
      network: DEFAULT_HISTORY_FILTERS.network,
      status: DEFAULT_HISTORY_FILTERS.status,
    });
  });
});
