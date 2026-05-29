"use client";

import { RecentBatchesTable } from "@/components/dashboard/RecentBatchesTable";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import { PaymentVolumeChart } from "@/components/dashboard/PaymentVolumeChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DeveloperResources } from "@/components/dashboard/developer-resources";
import { useWallet } from "@/contexts/WalletContext";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { VestingTTLAlert } from "@/components/dashboard/VestingTTLAlert";
import { useState } from "react";

export default function DashboardPage() {
  const { publicKey, expectedNetwork } = useWallet();
  const { metrics, loading } = useDashboardMetrics(publicKey, expectedNetwork);
  const [isBumping, setIsBumping] = useState(false);

  // Mock TTL data for demonstration
  const mockTTL = { remainingDays: 4, totalDays: 30 };

  const handleBump = async () => {
    setIsBumping(true);
    // Simulate bump logic
    setTimeout(() => setIsBumping(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* TTL Warning Banner */}
      <VestingTTLAlert
        remainingDays={mockTTL.remainingDays}
        totalDays={mockTTL.totalDays}
        onBump={handleBump}
        isBumping={isBumping}
      />

      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Dashboard Overview
        </h1>
        <p className="text-gray-400">
          Monitor your batch payment operations and performance
        </p>
      </div>

      {/* Overview Metrics */}
      <OverviewMetrics metrics={metrics} loading={loading} />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Actions Column */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>

        {/* Payment Volume Chart */}
        <div className="lg:col-span-2">
          <PaymentVolumeChart />
        </div>
      </div>

      {/* Recent Batches Table Section */}
      <RecentBatchesTable />

      {/* Developer Resources Section */}
      <DeveloperResources />
    </div>
  );
}
