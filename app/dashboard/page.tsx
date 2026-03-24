"use client"

import { motion } from "framer-motion"
import { 
  ArrowUpRight, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  ChevronDown,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SummaryCard } from "@/components/dashboard/SummaryCard"
import { ActionCard } from "@/components/dashboard/ActionCard"
import { TipsCard } from "@/components/dashboard/TipsCard"
import { RecentBatchesTable } from "@/components/dashboard/RecentBatchesTable"

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
]


export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
        <p className="text-gray-400">Monitor your batch payment operations and performance</p>
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
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", stat.iconBg)}>
                    <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                  </div>
                  <span className={cn("text-xs font-medium", stat.change === "Live" ? "text-purple-400" : "text-teal-400")}>
                    {stat.change}
                  </span>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Transaction Actions Column */}
        <div className="lg:col-span-1 space-y-6">
          <SummaryCard />
          <ActionCard />
          <TipsCard />
        </div>

        {/* Payment Volume Mockup Chart */}
        <div className="lg:col-span-2">
          <Card className="h-full border-[#1F2937] bg-[#121827]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white">Payment Volume</h2>
                <Button variant="outline" size="sm" className="border-[#1F2937] bg-[#1F293780]/30 text-xs">
                  Last 7 days <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-end justify-between h-[200px] gap-2 px-2">
                 {/* This is a simple visual mockup of the chart shown in the image */}
                 {[40, 60, 45, 80, 55, 90, 75].map((height, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div 
                        className="w-full bg-[#00D98B]/20 rounded-t-sm transition-all duration-300 group-hover:bg-[#00D98B]/30" 
                        style={{ height: `${height}%` }}
                      >
                         <div className="h-1 w-full bg-[#00D98B] rounded-full opacity-60"></div>
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase">Jan {15 + i}</span>
                   </div>
                 ))}
              </div>
              <div className="mt-8 pt-8 border-t border-[#1F2937] flex justify-between text-[10px] text-gray-500">
                <span>$0</span>
                <span>$5,000</span>
                <span>$10,000</span>
                <span>$15,000</span>
                <span>$20,000</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Batches Table Section */}
      <RecentBatchesTable />
    </div>
  )
}
