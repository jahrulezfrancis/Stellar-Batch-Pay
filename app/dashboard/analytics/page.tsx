"use client";

import { useMemo, useState } from "react";
import { DashboardWalletEmpty } from "@/components/dashboard/dashboard-wallet-empty";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import {
  PaymentVolumeChart,
  type PaymentVolumePoint,
} from "@/components/dashboard/PaymentVolumeChart";
import { useWallet } from "@/contexts/WalletContext";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { t } from "@/lib/i18n";

type Range = "7d" | "30d" | "90d";

/**
 * Analytics dashboard (#359). Reuses the existing OverviewMetrics + the
 * extended PaymentVolumeChart, and the `/api/dashboard-metrics?range=…`
 * endpoint that now returns daily-bucketed XLM volume.
 *
 * Wallet not connected: render a friendly empty state pointing at settings
 * so the chart never shows misleading mock data on a public route.
 */
export default function AnalyticsPage() {
  const { publicKey, network } = useWallet();
  const [range, setRange] = useState<Range>("7d");

  const effectiveNetwork = network === "mainnet" ? "mainnet" : "testnet";
  const { metrics, loading } = useDashboardMetrics(
    publicKey,
    effectiveNetwork,
    range,
  );

  const chartData = useMemo(() => {
    if (!metrics?.timeSeries) return undefined;
    const points: PaymentVolumePoint[] = metrics.timeSeries.map((p) => ({
      date: new Date(p.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      amount: p.amount,
    }));
    return { [range]: points } as Partial<
      Record<Range, PaymentVolumePoint[]>
    >;
  }, [metrics?.timeSeries, range]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {t("analytics.title")}
        </h1>
        <p className="text-gray-400">
          {t("analytics.description", { network: effectiveNetwork })}
        </p>
      </div>

      {!publicKey ? (
        <DashboardWalletEmpty />
      ) : (
        <>
          <OverviewMetrics metrics={metrics} loading={loading} />

          <PaymentVolumeChart
            initialRange={range}
            onRangeChange={(r) => setRange(r)}
            data={chartData}
          />
        </>
      )}
    </div>
  );
}
