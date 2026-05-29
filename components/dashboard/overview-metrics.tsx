"use client"

import { MetricCard } from "./metric-card"

interface MetricData {
  title: string
  value: string
  change: string
  icon: string
  iconBg: string
}

interface OverviewMetricsProps {
  metrics?: {
    totalPayments: number
    totalAmountSent: string
    successRate: string
    activeBatches: number
    totalPaymentsTrend?: string
    totalAmountSentTrend?: string
    successRateTrend?: string
    activeBatchesTrend?: string
  } | null
  loading?: boolean
}

export function OverviewMetrics({ metrics, loading }: OverviewMetricsProps) {
  const metricsData: MetricData[] = [
    {
      title: "Total Payments",
      value: loading ? "-" : (metrics?.totalPayments ?? 0).toLocaleString(),
      change: loading ? "Loading..." : metrics?.totalPaymentsTrend ?? "No trend",
      icon: "/1.svg",
      iconBg: "bg-teal-500/20",
    },
    {
      title: "Total Amount Sent",
      value: loading ? "-" : metrics?.totalAmountSent ?? "0 XLM",
      change: loading ? "Loading..." : metrics?.totalAmountSentTrend ?? "No trend",
      icon: "/2.svg",
      iconBg: "bg-blue-500/20",
    },
    {
      title: "Success Rate",
      value: loading ? "-" : metrics?.successRate ?? "0.0%",
      change: loading ? "Loading..." : metrics?.successRateTrend ?? "No trend",
      icon: "/3.svg",
      iconBg: "bg-green-500/20",
    },
    {
      title: "Active Batches",
      value: loading ? "-" : (metrics?.activeBatches ?? 0).toString(),
      change: loading ? "Loading..." : metrics?.activeBatchesTrend ?? "No trend",
      icon: "/4.svg",
      iconBg: "bg-purple-500/20",
    },
  ]

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {metricsData.map((metric, index) => (
        <MetricCard key={metric.title} {...metric} index={index} />
      ))}
    </div>
  )
}
