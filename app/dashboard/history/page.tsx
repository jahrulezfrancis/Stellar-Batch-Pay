"use client";

import { useState, useCallback } from "react";
import { MotionSafe } from "@/components/motion-safe";
import { DashboardWalletEmpty } from "@/components/dashboard/dashboard-wallet-empty";
import { pageEnter } from "@/lib/motion-tokens";
import { useWallet } from "@/contexts/WalletContext";
import {
  HistoryFilterBar,
  DEFAULT_HISTORY_FILTERS,
  type HistoryFilterValues,
} from "@/components/dashboard/HistoryFilterBar";
import { HistoryTable, type HistoricalBatch } from "@/components/dashboard/HistoryTable";
import { Pagination } from "@/components/dashboard/Pagination";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { HistoryExportCenter } from "@/components/dashboard/HistoryExportCenter";
import { Card, CardContent } from "@/components/ui/card";
import { dateRangeToFrom } from "@/lib/history-filters";
import { t } from "@/lib/i18n";

// #360: filter + pagination state is owned by the page so the
// HistoryTable query and Pagination controls actually react to user
// input. Before this change the filter bar's selects were
// uncontrolled, the pagination buttons had no onClick handlers, and
// the MetricsGrid never received aggregated data — the page looked
// enterprise-grade but didn't function.
const DEFAULT_LIMIT = 10;

/** Derive MetricsGrid data from the current page's loaded batches (#412). */
function computeMetrics(batches: HistoricalBatch[]) {
  if (batches.length === 0) return undefined;

  const totalBatches = batches.length;
  const totalPayments = batches.reduce((s, b) => s + b.totalPayments, 0);
  const totalVolume = batches.reduce((s, b) => s + parseFloat(b.totalAmount ?? "0"), 0);
  const successful = batches.filter(
    (b) => b.summary && b.summary.failed === 0 && b.status === "completed"
  ).length;
  const completed = batches.filter((b) => b.status === "completed").length;
  const successRate = completed > 0 ? ((successful / completed) * 100).toFixed(1) + "%" : "0.0%";

  return {
    totalBatches,
    totalPayments,
    successRate,
    totalVolume: `${totalVolume.toFixed(2)} XLM`,
  };
}

export default function HistoryPage() {
  const { publicKey } = useWallet();
  const [filters, setFilters] = useState<HistoryFilterValues>(DEFAULT_HISTORY_FILTERS);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadedBatches, setLoadedBatches] = useState<HistoricalBatch[]>([]);

  // Reset to page 1 whenever the filters change so a 5-page result
  // doesn't trap the user on page 3 of an empty filtered view.
  const handleFiltersChange = (next: HistoryFilterValues) => {
    setFilters(next);
    setPage(1);
  };

  const handlePaginationLoad = useCallback(({ totalPages: nextTotalPages }: { totalPages: number; total: number }) => {
    setTotalPages(Math.max(1, nextTotalPages));
  }, []);

  // #412: lift loaded rows up so MetricsGrid can aggregate them.
  const handleRowsLoad = useCallback((rows: HistoricalBatch[]) => {
    setLoadedBatches(rows);
  }, []);

  const metricsData = computeMetrics(loadedBatches);

  return (
    <MotionSafe {...pageEnter} className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">{t("history.title")}</h1>
        <p className="text-gray-400">
          {t("history.description")}
        </p>
      </div>

      {!publicKey ? (
        <DashboardWalletEmpty />
      ) : (
        <>
      <MetricsGrid data={metricsData} />

      <Card className="border-[#1F2937] bg-[#121827] shadow-lg">
        <CardContent className="p-6">
          <HistoryFilterBar values={filters} onChange={handleFiltersChange} />
        </CardContent>
      </Card>

      <Card className="border-[#1F2937] bg-[#121827] shadow-lg overflow-hidden">
        <CardContent className="p-0 sm:p-6">
          <HistoryTable
            page={page}
            limit={DEFAULT_LIMIT}
            statusFilter={filters.status === "all" ? undefined : filters.status}
            networkFilter={filters.network === "all" ? undefined : filters.network}
            searchFilter={filters.search}
            fromFilter={dateRangeToFrom(filters.dateRange)}
            onPaginationLoad={handlePaginationLoad}
            onRowsLoad={handleRowsLoad}
          />
          <div className="px-4 pb-4 sm:px-0 sm:pb-0">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </CardContent>
      </Card>

      <HistoryExportCenter />
        </>
      )}
    </MotionSafe>
  );
}
