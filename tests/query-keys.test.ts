/**
 * Tests for the central React Query key factory (#521).
 *
 * Pins the key hierarchy and — critically — proves that invalidating the parent
 * `batchHistoryKeys.all(pk)` key propagates to paginated/filtered list queries
 * built from `batchHistoryKeys.list(pk, …)`, which was the core bug: history was
 * invalidated with a key that callers worried would not match the longer table
 * keys, and dashboard metrics were never invalidated at all.
 */

import { describe, expect, test } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  batchHistoryKeys,
  dashboardMetricsKeys,
  BATCH_HISTORY_QUERY_KEY,
  DASHBOARD_METRICS_QUERY_KEY,
} from "../lib/query-keys";

describe("key factory shape", () => {
  test("batchHistoryKeys builds parent and child keys", () => {
    expect(batchHistoryKeys.all("GABC")).toEqual(["batch-history", "GABC"]);
    expect(batchHistoryKeys.list("GABC", 1, 20, "completed")).toEqual([
      "batch-history",
      "GABC",
      1,
      20,
      "completed",
    ]);
    expect(batchHistoryKeys.root).toEqual([BATCH_HISTORY_QUERY_KEY]);
  });

  test("dashboardMetricsKeys builds parent and detail keys", () => {
    expect(dashboardMetricsKeys.all("GABC")).toEqual([
      "dashboard-metrics",
      "GABC",
    ]);
    expect(dashboardMetricsKeys.detail("GABC", "testnet", "30d")).toEqual([
      "dashboard-metrics",
      "GABC",
      "testnet",
      "30d",
    ]);
    expect(dashboardMetricsKeys.root).toEqual([DASHBOARD_METRICS_QUERY_KEY]);
  });

  test("a child list key is a strict prefix-extension of the parent key", () => {
    const parent = batchHistoryKeys.all("GABC");
    const child = batchHistoryKeys.list("GABC", 2, 50, "failed");
    expect(child.slice(0, parent.length)).toEqual([...parent]);
  });
});

describe("invalidation propagation", () => {
  test("invalidating the parent key invalidates paginated/filtered children", async () => {
    const qc = new QueryClient();
    const pk = "GABC";

    const listKey = batchHistoryKeys.list(pk, 1, 20, "completed");
    const otherListKey = batchHistoryKeys.list(pk, 2, 20, "failed");
    qc.setQueryData(listKey, { items: [] });
    qc.setQueryData(otherListKey, { items: [] });

    expect(qc.getQueryState(listKey)?.isInvalidated).toBe(false);

    await qc.invalidateQueries({ queryKey: batchHistoryKeys.all(pk) });

    // Both filtered/paginated table queries are marked stale by the parent key.
    expect(qc.getQueryState(listKey)?.isInvalidated).toBe(true);
    expect(qc.getQueryState(otherListKey)?.isInvalidated).toBe(true);
  });

  test("invalidation is scoped to the account (no cross-account bleed)", async () => {
    const qc = new QueryClient();

    const mine = batchHistoryKeys.list("GME", 1, 20);
    const theirs = batchHistoryKeys.list("GYOU", 1, 20);
    qc.setQueryData(mine, { items: [] });
    qc.setQueryData(theirs, { items: [] });

    await qc.invalidateQueries({ queryKey: batchHistoryKeys.all("GME") });

    expect(qc.getQueryState(mine)?.isInvalidated).toBe(true);
    expect(qc.getQueryState(theirs)?.isInvalidated).toBe(false);
  });

  test("batch-history and dashboard-metrics are independent namespaces", async () => {
    const qc = new QueryClient();
    const pk = "GABC";

    const history = batchHistoryKeys.list(pk, 1, 20);
    const metrics = dashboardMetricsKeys.detail(pk, "testnet");
    qc.setQueryData(history, { items: [] });
    qc.setQueryData(metrics, { totalPayments: 0 });

    // Invalidating history alone must NOT touch the metrics namespace...
    await qc.invalidateQueries({ queryKey: batchHistoryKeys.all(pk) });
    expect(qc.getQueryState(metrics)?.isInvalidated).toBe(false);

    // ...which is why a completed batch must cross-invalidate metrics explicitly.
    await qc.invalidateQueries({ queryKey: dashboardMetricsKeys.all(pk) });
    expect(qc.getQueryState(metrics)?.isInvalidated).toBe(true);
  });
});
