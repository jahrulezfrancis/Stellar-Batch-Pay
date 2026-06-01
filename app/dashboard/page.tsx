"use client";

import { RecentBatchesTable } from "@/components/dashboard/RecentBatchesTable";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import { PaymentVolumeChart } from "@/components/dashboard/PaymentVolumeChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DeveloperResources } from "@/components/dashboard/developer-resources";
import { DashboardWalletEmpty } from "@/components/dashboard/dashboard-wallet-empty";
import { useWallet } from "@/contexts/WalletContext";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";

export default function DashboardPage() {
  const { publicKey, network, expectedNetwork } = useWallet();
  const dashboardNetwork = (network ?? expectedNetwork) === "mainnet" ? "mainnet" : "testnet";
  const { metrics, loading, error } = useDashboardMetrics(publicKey, dashboardNetwork);
  const hasNoData = Boolean(publicKey && !loading && !error && metrics && metrics.totalPayments === 0);

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
              <PaymentVolumeChart />
            </div>
          </div>

          <RecentBatchesTable publicKey={publicKey} network={dashboardNetwork} limit={5} />
        </>
      )}

      <DeveloperResources />
    </div>
  );
}
