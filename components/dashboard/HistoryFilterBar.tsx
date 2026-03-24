"use client"

import { Search, ChevronDown, Calendar, Globe, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface HistoryFilterBarProps {
  className?: string
}

export function HistoryFilterBar({ className }: HistoryFilterBarProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Search Batch</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Batch ID or keyword..." 
            className="pl-10 bg-[#121827] border-[#1F2937] text-white focus:ring-[#00D98B]/20 focus:border-[#00D98B]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Date Range</label>
        <Select defaultValue="7days">
          <SelectTrigger className="bg-[#121827] border-[#1F2937] text-white focus:ring-[#00D98B]/20">
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
        <label className="text-sm font-medium text-gray-400">Network</label>
        <Select defaultValue="all">
          <SelectTrigger className="bg-[#121827] border-[#1F2937] text-white focus:ring-[#00D98B]/20">
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
        <label className="text-sm font-medium text-gray-400">Status</label>
        <Select defaultValue="all">
          <SelectTrigger className="bg-[#121827] border-[#1F2937] text-white focus:ring-[#00D98B]/20">
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
