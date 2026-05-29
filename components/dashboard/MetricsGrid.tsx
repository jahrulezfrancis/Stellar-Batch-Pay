import { Layers, Send, CheckCircle2, Coins } from "lucide-react";
import { MetricCard } from "./MetricCard";

interface MetricsData {
  totalBatches: number;
  totalPayments: number;
  successRate: string;
  totalVolume: string;
}

interface MetricsGridProps {
  data?: MetricsData;
}

export function MetricsGrid({ data }: MetricsGridProps) {
  const metrics = data ?? {
    totalBatches: 0,
    totalPayments: 0,
    successRate: "0.0%",
    totalVolume: "0 XLM",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        icon={Layers}
        title="Total Batches"
        value={metrics.totalBatches}
        iconBgColor="bg-emerald-500/10"
        iconColor="text-emerald-500"
      />
      <MetricCard
        icon={Send}
        title="Total Payments"
        value={metrics.totalPayments.toLocaleString()}
        iconBgColor="bg-emerald-500/10"
        iconColor="text-emerald-500"
      />
      <MetricCard
        icon={CheckCircle2}
        title="Success Rate"
        value={metrics.successRate}
        iconBgColor="bg-emerald-500/10"
        iconColor="text-emerald-500"
      />
      <MetricCard
        icon={Coins}
        title="Total Volume"
        value={metrics.totalVolume}
        iconBgColor="bg-emerald-500/10"
        iconColor="text-emerald-500"
      />
    </div>
  );
}
