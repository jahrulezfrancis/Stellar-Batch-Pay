"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MotionSafe } from "@/components/motion-safe";
import { DashboardWalletEmpty } from "@/components/dashboard/dashboard-wallet-empty";
import { pageEnter } from "@/lib/motion-tokens";
import { useWallet } from "@/contexts/WalletContext";
import {
  HistoryFilterBar,
  type HistoryFilterValues,
} from "@/components/dashboard/HistoryFilterBar";
import { HistoryTable } from "@/components/dashboard/HistoryTable";
import { Pagination } from "@/components/dashboard/Pagination";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { HistoryExportCenter } from "@/components/dashboard/HistoryExportCenter";
import { Card, CardContent } from "@/components/ui/card";
import {
  dateRangeToFrom,
  parseHistoryFilters,
} from "@/lib/history-filters";
import { t } from "@/lib/i18n";

// #360: filter + pagination state is owned by the page so the
// HistoryTable query and Pagination controls actually react to user
// input. Before this change the filter bar's selects were
// uncontrolled, the pagination buttons had no onClick handlers, and
// the MetricsGrid never received aggregated data — the page looked
// enterprise-grade but didn't function.
const DEFAULT_LIMIT = 10;

export default function HistoryPage() {
  const { publicKey } = useWallet();
  const searchParams = useSearchParams();
  const parsedFilters = useMemo(
    () => parseHistoryFilters(searchParams),
    [searchParams.toString()],
  );
  const [filters, setFilters] = useState<HistoryFilterValues>(parsedFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [aggregateMetrics, setAggregateMetrics] = useState<{
    totalBatches: number;
    totalPayments: number;
    successRate: string;
    totalVolume: string;
    failedJobs: number;
    failedPayments: number;
  } | undefined>(undefined);

  useEffect(() => {
    setFilters(parsedFilters);
    setPage(1);
  }, [parsedFilters]);

  // Reset to page 1 whenever the filters change so a 5-page result
  // doesn't trap the user on page 3 of an empty filtered view.
  const handleFiltersChange = (next: HistoryFilterValues) => {
    setFilters(next);
    setPage(1);
  };

  const handlePaginationLoad = useCallback(({ totalPages: nextTotalPages }: { totalPages: number; total: number }) => {
    setTotalPages(Math.max(1, nextTotalPages));
  }, []);

  // Use aggregate metrics from API (computed across all filtered results)
  const handleAggregateMetricsLoad = useCallback((metrics: {
    totalBatches: number;
    totalPayments: number;
    successRate: string;
    totalVolume: string;
    failedJobs: number;
    failedPayments: number;
  }) => {
    setAggregateMetrics(metrics);
  }, []);

  const metricsData = aggregateMetrics;

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
            onAggregateMetricsLoad={handleAggregateMetricsLoad}
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
