"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface MetricCardProps {
  title: string
  value: string
  change: string
  icon: string
  iconBg: string
  index?: number
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  iconBg,
  index = 0,
}: MetricCardProps) {
  const isLiveIndicator = change === "Live"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="border border-slate-700/50 bg-slate-900/50 shadow-lg hover:shadow-xl hover:border-slate-600/70 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg",
                iconBg
              )}
            >
              <Image
                src={icon}
                alt={title}
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </div>
            <span
              className={cn(
                "text-xs font-semibold",
                isLiveIndicator ? "text-purple-400" : "text-teal-400"
              )}
            >
              {change}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
