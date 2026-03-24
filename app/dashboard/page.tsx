"use client";

import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SummaryCard } from "@/components/dashboard/SummaryCard"
import { ActionCard } from "@/components/dashboard/ActionCard"
import { TipsCard } from "@/components/dashboard/TipsCard"
import { RecentBatchesTable } from "@/components/dashboard/RecentBatchesTable"
import { OverviewMetrics } from "@/components/dashboard/overview-metrics"


const stats = [
  {
    title: "Total Payments",
    value: "24,567",
    change: "+12.5%",
    icon: ArrowUpRight,
    iconBg: "bg-teal-500/20",
    iconColor: "text-teal-500",
  },
  {
    title: "Total Amount Sent",
    value: "$1.2M",
    change: "+8.2%",
    icon: Wallet,
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-500",
  },
  {
    title: "Success Rate",
    value: "98.7%",
    change: "+2.1%",
    icon: CheckCircle2,
    iconBg: "bg-green-500/20",
    iconColor: "text-green-500",
  },
  {
    title: "Active Batches",
    value: "12",
    change: "Live",
    icon: Clock,
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-500",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
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
      <OverviewMetrics />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Actions Sidebar */}
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
    </div>
  );
}
