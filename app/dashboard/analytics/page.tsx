"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import {
  PaymentVolumeChart,
  type PaymentVolumePoint,
} from "@/components/dashboard/PaymentVolumeChart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";

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
          Analytics
        </h1>
        <p className="text-gray-400">
          On-chain volume and success metrics for the connected wallet on the{" "}
          {effectiveNetwork} network.
        </p>
      </div>

      {!publicKey ? (
        <Card className="border-[#1F2937] bg-[#121827]">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <h2 className="text-xl font-semibold text-white">
              Connect a wallet to see analytics
            </h2>
            <p className="max-w-md text-sm text-gray-400">
              Analytics are derived from Horizon operations for the connected
              account. Connect a wallet in Settings to populate volume,
              success rate, and the daily chart.
            </p>
            <Button
              asChild
              className="bg-[#00D98B] hover:bg-[#00D98B]/90 text-white"
            >
              <Link href="/dashboard/settings">Go to Settings</Link>
            </Button>
          </CardContent>
        </Card>
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
