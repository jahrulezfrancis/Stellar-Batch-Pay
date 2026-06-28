/**
 * Central React Query key factory (#521).
 *
 * Before this module, batch-history keys were built three different ways:
 *   - hooks/use-batch-history.ts:     ["batch-history", publicKey]
 *   - components/dashboard/*Table:    ["batch-history", publicKey, page, limit, …filters]
 *   - contexts/BatchFlowContext.tsx:  [BATCH_HISTORY_QUERY_KEY, publicKey]
 * and dashboard metrics used a separate ["dashboard-metrics", …] namespace that
 * nothing invalidated when a batch completed. The inconsistency made
 * `invalidateQueries` behaviour unpredictable and left metric cards stale.
 *
 * This module is the single source of truth for those keys. The hierarchy is:
 *
 *   batchHistoryKeys.root                       → ["batch-history"]
 *   batchHistoryKeys.all(pk)                     → ["batch-history", pk]            (parent)
 *   batchHistoryKeys.list(pk, …filters)          → ["batch-history", pk, …filters]  (children)
 *
 *   dashboardMetricsKeys.root                    → ["dashboard-metrics"]
 *   dashboardMetricsKeys.all(pk)                 → ["dashboard-metrics", pk]        (parent)
 *   dashboardMetricsKeys.detail(pk, net, range)  → ["dashboard-metrics", pk, net, range]
 *
 * TanStack Query matches partially by default (`exact: false`), so invalidating
 * a parent key (`*.all(pk)`) refetches every child list/detail built from
 * `*.list(pk, …)` / `*.detail(pk, …)`. Always invalidate via the `.all(pk)`
 * parent so paginated/filtered queries propagate correctly.
 */

export const BATCH_HISTORY_QUERY_KEY = "batch-history" as const;
export const DASHBOARD_METRICS_QUERY_KEY = "dashboard-metrics" as const;

type PublicKey = string | null | undefined;

export const batchHistoryKeys = {
  /** Bare namespace — matches every batch-history query for every account. */
  root: [BATCH_HISTORY_QUERY_KEY] as const,
  /** Parent key for one account. Use this for invalidation (matches all lists). */
  all: (publicKey: PublicKey) => [BATCH_HISTORY_QUERY_KEY, publicKey] as const,
  /** Specific paginated/filtered list key. `rest` carries page/limit/filters. */
  list: (publicKey: PublicKey, ...rest: unknown[]) =>
    [BATCH_HISTORY_QUERY_KEY, publicKey, ...rest] as const,
};

export const dashboardMetricsKeys = {
  /** Bare namespace — matches every dashboard-metrics query for every account. */
  root: [DASHBOARD_METRICS_QUERY_KEY] as const,
  /** Parent key for one account. Use this for invalidation. */
  all: (publicKey: PublicKey) =>
    [DASHBOARD_METRICS_QUERY_KEY, publicKey] as const,
  /** Specific metrics query for an account + network (+ optional range). */
  detail: (
    publicKey: PublicKey,
    network: string,
    range?: "7d" | "30d" | "90d",
  ) => [DASHBOARD_METRICS_QUERY_KEY, publicKey, network, range] as const,
};
