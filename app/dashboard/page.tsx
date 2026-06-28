"use client";

import { useMemo, useState } from "react";
import { RecentBatchesTable } from "@/components/dashboard/RecentBatchesTable";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import {
  PaymentVolumeChart,
  type PaymentVolumePoint,
} from "@/components/dashboard/PaymentVolumeChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DeveloperResources } from "@/components/dashboard/developer-resources";
import { DashboardWalletEmpty } from "@/components/dashboard/dashboard-wallet-empty";
import { useWallet } from "@/contexts/WalletContext";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";

type Range = "7d" | "30d" | "90d";

export default function DashboardPage() {
  const { publicKey, network, expectedNetwork } = useWallet();
  const dashboardNetwork = (network ?? expectedNetwork) === "mainnet" ? "mainnet" : "testnet";
  const [range, setRange] = useState<Range>("7d");
  // #518: request the same range the chart shows so the main dashboard renders
  // the wallet's real volume, sharing the analytics page's metrics source.
  const { metrics, loading, error } = useDashboardMetrics(publicKey, dashboardNetwork, range);
  const hasNoData = Boolean(publicKey && !loading && !error && metrics && metrics.totalPayments === 0);

  // #518: map the API time-series into the chart's per-range shape. Undefined
  // when the API has no series yet, which lets the chart show its empty state
  // instead of fictional sample volume.
  const chartData = useMemo(() => {
    if (!metrics?.timeSeries) return undefined;
    const points: PaymentVolumePoint[] = metrics.timeSeries.map((p) => ({
      date: new Date(p.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      amount: p.amount,
    }));
    return { [range]: points } as Partial<Record<Range, PaymentVolumePoint[]>>;
  }, [metrics?.timeSeries, range]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {t("dashboard.title")}
        </h1>
        <p className="text-gray-400">
          {t("dashboard.description")}
        </p>
      </div>

      {!publicKey ? (
        <DashboardWalletEmpty />
      ) : (
        <>
          {hasNoData ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#1F2937] bg-[#121827] px-4 py-3 text-sm text-gray-300">
              <Badge className="bg-[#00D98B]/10 text-[#00D98B] hover:bg-[#00D98B]/10">
                {t("dashboard.connected")}
              </Badge>
              <span className="font-mono">{publicKey}</span>
              <span className="uppercase tracking-wide text-gray-500">{dashboardNetwork}</span>
              <span className="text-gray-400">{t("dashboard.noBatchesYet")}</span>
            </div>
          ) : null}

          <OverviewMetrics metrics={metrics} loading={loading} />

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <QuickActions />
            </div>
            <div className="lg:col-span-2">
              {/* #518: previewMode is intentionally omitted (defaults false) so
                  a connected wallet never sees mock volume. */}
              <PaymentVolumeChart
                initialRange={range}
                onRangeChange={setRange}
                data={chartData}
              />
            </div>
          </div>

          <RecentBatchesTable publicKey={publicKey} network={dashboardNetwork} limit={5} />
        </>
      )}

      <DeveloperResources />
    </div>
  );
}
