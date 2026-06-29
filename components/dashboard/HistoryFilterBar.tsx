"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  DEFAULT_HISTORY_FILTERS,
  type DateRangeValue,
  type HistoryFilterValues,
  type NetworkValue,
  type StatusValue,
} from "@/lib/history-filters"

interface HistoryFilterBarProps {
  values: HistoryFilterValues
  onChange: (next: HistoryFilterValues) => void
  className?: string
}

export type { DateRangeValue, HistoryFilterValues, NetworkValue, StatusValue }
export { DEFAULT_HISTORY_FILTERS }

export function HistoryFilterBar({ values, onChange, className }: HistoryFilterBarProps) {
  const update = <K extends keyof HistoryFilterValues>(
    key: K,
    value: HistoryFilterValues[K],
  ) => onChange({ ...values, [key]: value })

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400" htmlFor="history-search">
          Search Batch
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            id="history-search"
            placeholder="Batch ID or keyword..."
            value={values.search}
            onChange={(e) => update("search", e.target.value)}
            className="pl-10 bg-[#121827] border-[#1F2937] text-white focus:ring-[#00D98B]/20 focus:border-[#00D98B]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400" htmlFor="history-date-range">Date Range</label>
        <Select
          value={values.dateRange}
          onValueChange={(v) => update("dateRange", v as DateRangeValue)}
        >
          <SelectTrigger id="history-date-range" className="bg-[#121827] border-[#1F2937] text-white focus:ring-[#00D98B]/20">
            <SelectValue placeholder="Select Range" />
          </SelectTrigger>
          <SelectContent className="bg-[#121827] border-[#1F2937] text-white">
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400" htmlFor="history-network">Network</label>
        <Select
          value={values.network}
          onValueChange={(v) => update("network", v as NetworkValue)}
        >
          <SelectTrigger id="history-network" className="bg-[#121827] border-[#1F2937] text-white focus:ring-[#00D98B]/20">
            <SelectValue placeholder="All Networks" />
          </SelectTrigger>
          <SelectContent className="bg-[#121827] border-[#1F2937] text-white">
            <SelectItem value="all">All Networks</SelectItem>
            <SelectItem value="mainnet">Mainnet</SelectItem>
            <SelectItem value="testnet">Testnet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400" htmlFor="history-status">Status</label>
        <Select
          value={values.status}
          onValueChange={(v) => update("status", v as StatusValue)}
        >
          <SelectTrigger id="history-status" className="bg-[#121827] border-[#1F2937] text-white focus:ring-[#00D98B]/20">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#121827] border-[#1F2937] text-white">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
