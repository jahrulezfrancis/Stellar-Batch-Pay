"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/WalletContext"
import { cn } from "@/lib/utils"

export interface HistoricalBatch {
  jobId: string
  createdAt: string
  network: "testnet" | "mainnet"
  totalPayments: number
  totalAmount: string | null
  completedBatches: number
  totalBatches: number
  status: "queued" | "processing" | "completed" | "failed"
  summary: { successful: number; failed: number } | null
}

interface HistoryTableProps {
  data?: HistoricalBatch[]
  className?: string
  page?: number
  limit?: number
  statusFilter?: string
  networkFilter?: string
  searchFilter?: string
  fromFilter?: string
  onPaginationLoad?: (pagination: { totalPages: number; total: number }) => void
  onRowsLoad?: (rows: HistoricalBatch[]) => void
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function deriveDisplayStatus(batch: HistoricalBatch): "Success" | "Partial" | "Failed" | "Processing" | "Queued" {
  if (batch.status === "queued")      return "Queued"
  if (batch.status === "processing")  return "Processing"
  if (batch.status === "failed")      return "Failed"
  if (batch.summary) {
    if (batch.summary.failed === 0)   return "Success"
    if (batch.summary.successful > 0) return "Partial"
    return "Failed"
  }
  return "Success"
}

async function fetchHistory(params: {
  publicKey: string
  page: number
  limit: number
  statusFilter?: string
  networkFilter?: string
  searchFilter?: string
  fromFilter?: string
}): Promise<{
  items: HistoricalBatch[]
  pagination: { totalPages: number; total: number }
}> {
  const urlParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    publicKey: params.publicKey,
  })
  if (params.statusFilter) urlParams.set("status", params.statusFilter)
  if (params.networkFilter) urlParams.set("network", params.networkFilter)
  if (params.searchFilter?.trim()) urlParams.set("search", params.searchFilter.trim())
  if (params.fromFilter) urlParams.set("from", params.fromFilter)

  const res = await fetch(`/api/batch-history?${urlParams.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function HistoryTable({
  data,
  className,
  page = 1,
  limit = 20,
  statusFilter,
  networkFilter,
  searchFilter,
  fromFilter,
  onPaginationLoad,
  onRowsLoad,
}: HistoryTableProps) {
  const router = useRouter()
  const { publicKey } = useWallet()
  const [debouncedSearch, setDebouncedSearch] = useState(searchFilter ?? "")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchFilter ?? ""), 300)
    return () => clearTimeout(timer)
  }, [searchFilter])

  const queryKey = useMemo(
    () => ["batch-history", publicKey, page, limit, statusFilter, networkFilter, debouncedSearch, fromFilter] as const,
    [publicKey, page, limit, statusFilter, networkFilter, debouncedSearch, fromFilter],
  )

  const { data: result, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      fetchHistory({
        publicKey: publicKey!,
        page,
        limit,
        statusFilter,
        networkFilter,
        searchFilter: debouncedSearch,
        fromFilter,
      }),
    enabled: !!publicKey && !data,
    staleTime: 30 * 1000,
    placeholderData: (previousData) =>
      previousData ?? { items: [], pagination: { totalPages: 1, total: 0 } },
  })

  const rows = data ?? result?.items ?? []

  useEffect(() => {
    if (result?.pagination) {
      onPaginationLoad?.(result.pagination)
    }
  }, [result?.pagination, onPaginationLoad])

  useEffect(() => {
    if (result?.items) {
      onRowsLoad?.(result.items)
    }
  }, [result?.items, onRowsLoad])

  const openBatchDetail = useCallback(
    (jobId: string) => router.push(`/dashboard/history/${jobId}`),
    [router],
  )

  if (isLoading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading history…</span>
      </div>
    )
  }

  if (error && rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-red-400">
        Failed to load batch history: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        No batch history found.
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto overflow-y-hidden">
        <table className="w-full text-left min-w-[1000px]">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 border-b border-[#1F2937]">
              <th className="pb-4 px-4 whitespace-nowrap">
                <div className="flex items-center gap-1 cursor-pointer hover:text-gray-300">
                  Batch ID <ChevronDown className="h-3 w-3" />
                </div>
              </th>
              <th className="pb-4 px-4 whitespace-nowrap">
                <div className="flex items-center gap-1 cursor-pointer hover:text-gray-300">
                  Date Submitted <ChevronDown className="h-3 w-3" />
                </div>
              </th>
              <th className="pb-4 px-4 whitespace-nowrap">Network</th>
              <th className="pb-4 px-4 whitespace-nowrap">Recipients</th>
              <th className="pb-4 px-4 whitespace-nowrap">
                <div className="flex items-center gap-1 cursor-pointer hover:text-gray-300">
                  Total Amount <ChevronDown className="h-3 w-3" />
                </div>
              </th>
              <th className="pb-4 px-4 whitespace-nowrap">Transactions</th>
              <th className="pb-4 px-4 whitespace-nowrap">Status</th>
              <th className="pb-4 px-4 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {rows.map((batch) => {
              const displayStatus = deriveDisplayStatus(batch)
              const txLabel = batch.totalBatches > 0
                ? `${batch.completedBatches}/${batch.totalBatches}`
                : "—"
              const networkLabel = batch.network === "mainnet" ? "Mainnet" : "Testnet"

              return (
                <tr key={batch.jobId} className="border-b border-[#1F2937]/50 hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-4 font-medium text-gray-300 whitespace-nowrap font-mono text-xs">
                    {batch.jobId.slice(0, 8)}…
                  </td>
                  <td className="py-5 px-4 text-gray-400 whitespace-nowrap">{formatDate(batch.createdAt)}</td>
                  <td className="py-5 px-4">
                    <Badge variant="outline" className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] items-center gap-1.5 border-none",
                      batch.network === "mainnet" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                    )}>
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        batch.network === "mainnet" ? "bg-blue-400" : "bg-purple-400"
                      )} />
                      {networkLabel}
                    </Badge>
                  </td>
                  <td className="py-5 px-4 text-gray-400">{batch.totalPayments}</td>
                  <td className="py-5 px-4 font-bold text-white whitespace-nowrap">
                    {batch.totalAmount ? `${batch.totalAmount} XLM` : "—"}
                  </td>
                  <td className="py-5 px-4 text-gray-400 font-mono whitespace-nowrap">{txLabel}</td>
                  <td className="py-5 px-4">
                    <HistoryStatusBadge status={displayStatus} />
                  </td>
                  <td className="py-5 px-4 text-right">
                    <Button
                      variant="link"
                      className="text-[#00D98B] hover:text-[#00D98B]/80 p-0 h-auto font-medium"
                      onClick={() => openBatchDetail(batch.jobId)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="flex flex-col gap-4 md:hidden">
        {rows.map((batch) => {
          const displayStatus = deriveDisplayStatus(batch)
          const txLabel = batch.totalBatches > 0
            ? `${batch.completedBatches}/${batch.totalBatches}`
            : "—"
          const networkLabel = batch.network === "mainnet" ? "Mainnet" : "Testnet"

          return (
            <div
              key={batch.jobId}
              className="flex flex-col p-5 rounded-2xl border border-[#1F2937] bg-[#121827] gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-200 font-mono text-xs">{batch.jobId.slice(0, 8)}…</span>
                <HistoryStatusBadge status={displayStatus} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Amount</span>
                  <span className="text-white font-bold">
                    {batch.totalAmount ? `${batch.totalAmount} XLM` : "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Recipients</span>
                  <span className="text-white">{batch.totalPayments}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Network</span>
                  <Badge variant="outline" className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] items-center gap-1.5 border-none w-fit",
                    batch.network === "mainnet" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                  )}>
                    <div className={cn(
                      "h-1 w-1 rounded-full",
                      batch.network === "mainnet" ? "bg-blue-400" : "bg-purple-400"
                    )} />
                    {networkLabel}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Progress</span>
                  <span className="text-gray-400 font-mono text-xs">{txLabel}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1F2937]">
                <span className="text-xs text-gray-500">{formatDate(batch.createdAt)}</span>
                <Button
                  variant="link"
                  className="text-[#00D98B] hover:text-[#00D98B]/80 p-0 h-auto text-xs font-semibold"
                  onClick={() => openBatchDetail(batch.jobId)}
                >
                  View Details <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type DisplayStatus = "Success" | "Partial" | "Failed" | "Processing" | "Queued"

function HistoryStatusBadge({ status }: { status: DisplayStatus }) {
  const configs: Record<DisplayStatus, { color: string; dot: string; label: string }> = {
    Success:    { color: "bg-green-500/10 text-green-400 border-green-500/20",   dot: "bg-green-400",  label: "Success" },
    Partial:    { color: "bg-amber-500/10 text-amber-400 border-amber-500/20",   dot: "bg-amber-400",  label: "Partial" },
    Failed:     { color: "bg-red-500/10 text-red-400 border-red-500/20",         dot: "bg-red-400",    label: "Failed" },
    Processing: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20",      dot: "bg-blue-400",   label: "Processing" },
    Queued:     { color: "bg-gray-500/10 text-gray-400 border-gray-500/20",      dot: "bg-gray-400",   label: "Queued" },
  }

  const cfg = configs[status]

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 border w-fit capitalize",
        cfg.color,
      )}
    >
      <div className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </Badge>
  )
}
