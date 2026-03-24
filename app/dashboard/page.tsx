"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Wallet, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RecentBatchesTable } from "@/components/dashboard/RecentBatchesTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PaymentVolumeChart } from "@/components/dashboard/PaymentVolumeChart";

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

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-[#1F2937] bg-[#121827] shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      stat.iconBg,
                    )}
                  >
                    <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      stat.change === "Live"
                        ? "text-purple-400"
                        : "text-teal-400",
                    )}
                  >
                    {stat.change}
                  </span>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-medium text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

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
