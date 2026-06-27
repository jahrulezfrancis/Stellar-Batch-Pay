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

export interface BatchHistoryResponse {
  items: HistoricalBatch[]
  pagination: { totalPages: number; total: number }
  aggregateMetrics?: {
    totalBatches: number
    totalPayments: number
    successRate: string
    totalVolume: string
  }
}

export const BATCH_HISTORY_QUERY_KEY = "batch-history" as const

export function batchHistoryQueryKey(
  publicKey: string | null | undefined,
  ...rest: unknown[]
) {
  return [BATCH_HISTORY_QUERY_KEY, publicKey, ...rest] as const
}

export async function fetchHistory(params: {
  publicKey: string
  page?: number
  limit?: number
  statusFilter?: string
  networkFilter?: string
  searchFilter?: string
  fromFilter?: string
  sort?: string
  order?: string
}): Promise<BatchHistoryResponse> {
  const urlParams = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
    publicKey: params.publicKey,
  })
  if (params.statusFilter) urlParams.set("status", params.statusFilter)
  if (params.networkFilter) urlParams.set("network", params.networkFilter)
  if (params.searchFilter?.trim()) urlParams.set("search", params.searchFilter.trim())
  if (params.fromFilter) urlParams.set("from", params.fromFilter)
  if (params.sort) urlParams.set("sort", params.sort)
  if (params.order) urlParams.set("order", params.order)

  const res = await fetch(`/api/batch-history?${urlParams.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
