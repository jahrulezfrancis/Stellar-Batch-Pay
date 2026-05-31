"use client";

/**
 * Batch detail page (#368).
 *
 * Previously, the History page's "View Details" action opened the
 * raw `/api/batch-status/:jobId` JSON in a new tab — fine for an
 * engineer, intimidating for an operations user. This page formats
 * the same job into:
 *
 *   - A header card with job id, network, totals.
 *   - A per-recipient status table with each transaction hash linked
 *     to the appropriate Stellar explorer (testnet vs mainnet).
 *   - "Copy hash" + "Open on stellar.expert" actions per recipient.
 *   - "Export Results" (#311) buttons for CSV + printable HTML so
 *     accounting / payroll teams can pull records without leaving
 *     the dashboard.
 *
 * The URL is deep-linkable so support tickets can reference a
 * specific batch by job id.
 */

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MotionSafe } from "@/components/motion-safe";
import { DashboardWalletEmpty } from "@/components/dashboard/dashboard-wallet-empty";
import { pageEnter } from "@/lib/motion-tokens";
import { ArrowLeft, Copy, ExternalLink, Download, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import {
  buildBatchExportRows,
  toBatchExportCsv,
  toBatchExportHtml,
} from "@/lib/dashboard/batch-export";
import {
  mapBatchStatusToDetailView,
  type BatchDetailView,
} from "@/lib/dashboard/batch-detail";

function explorerUrl(hash: string, network: "testnet" | "mainnet"): string {
  const base =
    network === "mainnet"
      ? "https://stellar.expert/explorer/public"
      : "https://stellar.expert/explorer/testnet";
  return `${base}/tx/${encodeURIComponent(hash)}`;
}

function downloadFile(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BatchDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const router = useRouter();
  const { publicKey } = useWallet();
  const [data, setData] = useState<BatchDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!publicKey) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ publicKey });
        const res = await fetch(`/api/batch-status/${jobId}?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to load batch (HTTP ${res.status})`);
        }
        const body = await res.json();
        if (!cancelled) setData(mapBatchStatusToDetailView(body));
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [jobId, publicKey]);

  const handleRetry = async () => {
    if (!data?.summary?.failed) {
      return;
    }

    setRetrying(true);
    try {
      const res = await fetch("/api/batch-retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || `Retry failed (${res.status})`);
      }

      toast.success(`Retry job queued (${body.jobId})`);
      router.push(`/dashboard/history/${body.jobId}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRetrying(false);
    }
  };

  const exportRows = data ? buildBatchExportRows(data) : [];

  return (
    <MotionSafe {...pageEnter} className="space-y-6">
      <Link
        href="/dashboard/history"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to history
      </Link>

      <Card className="border-[#1F2937] bg-[#121827] shadow-lg">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl text-white">Batch detail</CardTitle>
              <p className="font-mono text-xs text-gray-500 mt-1 break-all">{jobId}</p>
            </div>
            {data && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-gray-300 border-[#1F2937]">
                  {data.network === "mainnet" ? "Mainnet" : "Testnet"}
                </Badge>
                <Badge
                  className={
                    data.status === "completed"
                      ? "bg-[#00D98B]/20 text-[#00D98B] border-[#00D98B]/30"
                      : data.status === "failed"
                        ? "bg-red-500/20 text-red-300 border-red-500/30"
                        : "bg-yellow-500/20 text-yellow-200 border-yellow-500/30"
                  }
                >
                  {data.status}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading job…
            </div>
          )}
          {!loading && !publicKey && <DashboardWalletEmpty className="border-none bg-transparent" />}
          {error && <p className="text-red-300">{error}</p>}
          {data && (
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <Metric label="Recipients" value={data.recipients.length} />
              <Metric
                label="Successful"
                value={data.summary?.successful ?? 0}
                tone="success"
              />
              <Metric
                label="Failed"
                value={data.summary?.failed ?? 0}
                tone={data.summary?.failed ? "danger" : "neutral"}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {data && (
        <Card className="border-[#1F2937] bg-[#121827] shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Per-recipient results</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadFile(
                    `batch-${jobId}.csv`,
                    toBatchExportCsv(exportRows),
                    "text/csv",
                  )
                }
                aria-label="Export this batch as CSV"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export CSV
              </Button>
              {data.summary?.failed ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRetry}
                  disabled={retrying}
                >
                  {retrying ? "Retrying…" : `Retry ${data.summary.failed} Failed`}
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadFile(
                    `batch-${jobId}.html`,
                    toBatchExportHtml(exportRows, jobId, data.network),
                    "text/html",
                  )
                }
                aria-label="Export this batch as a printable HTML receipt"
              >
                <FileText className="h-4 w-4 mr-1.5" />
                Export PDF (HTML)
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-[#1F2937]">
                  <th className="py-2 pr-4">Address</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Tx hash</th>
                </tr>
              </thead>
              <tbody>
                {data.recipients.map((r, i) => (
                  <tr key={`${r.address}-${i}`} className="border-b border-[#1F2937]/50">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-300 break-all">
                      {r.address}
                    </td>
                    <td className="py-3 pr-4 text-white">
                      {r.amount} {r.asset}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        className={
                          r.status === "success"
                            ? "bg-[#00D98B]/20 text-[#00D98B]"
                            : r.status === "failed"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-yellow-500/20 text-yellow-200"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      {r.transactionHash ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={explorerUrl(r.transactionHash, data.network)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-[#00D98B] hover:underline"
                          >
                            {r.transactionHash.slice(0, 10)}…
                          </a>
                          <button
                            type="button"
                            aria-label="Copy transaction hash"
                            onClick={() => {
                              if (typeof navigator !== "undefined" && navigator.clipboard) {
                                navigator.clipboard.writeText(r.transactionHash!);
                              }
                            }}
                            className="text-gray-500 hover:text-white"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={explorerUrl(r.transactionHash, data.network)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-white"
                            aria-label="Open transaction on stellar.expert"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </MotionSafe>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "danger" | "neutral";
}) {
  const cls =
    tone === "success"
      ? "text-[#00D98B]"
      : tone === "danger"
        ? "text-red-300"
        : "text-white";
  return (
    <div className="rounded-md border border-[#1F2937] bg-[#0E1422] px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-xl font-semibold ${cls}`}>{value}</p>
    </div>
  );
}
