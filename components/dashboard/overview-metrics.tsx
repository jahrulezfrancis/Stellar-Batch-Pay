"use client"

import { MetricCard } from "./metric-card"
import { t } from "@/lib/i18n"

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
      title: t("dashboard.metrics.totalPayments"),
      value: loading ? "-" : (metrics?.totalPayments ?? 0).toLocaleString(),
      change: loading ? t("dashboard.metrics.loading") : metrics?.totalPaymentsTrend ?? t("dashboard.metrics.noTrend"),
      icon: "/1.svg",
      iconBg: "bg-teal-500/20",
    },
    {
      title: t("dashboard.metrics.totalAmountSent"),
      value: loading ? "-" : metrics?.totalAmountSent ?? "0 XLM",
      change: loading ? t("dashboard.metrics.loading") : metrics?.totalAmountSentTrend ?? t("dashboard.metrics.noTrend"),
      icon: "/2.svg",
      iconBg: "bg-blue-500/20",
    },
    {
      title: t("dashboard.metrics.successRate"),
      value: loading ? "-" : metrics?.successRate ?? "0.0%",
      change: loading ? t("dashboard.metrics.loading") : metrics?.successRateTrend ?? t("dashboard.metrics.noTrend"),
      icon: "/3.svg",
      iconBg: "bg-green-500/20",
    },
    {
      title: t("dashboard.metrics.activeBatches"),
      value: loading ? "-" : (metrics?.activeBatches ?? 0).toLocaleString(),
      change: loading ? t("dashboard.metrics.loading") : metrics?.activeBatchesTrend ?? t("dashboard.metrics.noTrend"),
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
