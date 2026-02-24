"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { BatchSummary } from "@/components/batch-summary";
import { ResultsDisplay } from "@/components/results-display";
import { JobProgress } from "@/components/job-progress";
import { parseInput, validatePaymentInstructions } from "@/lib/stellar";
import type {
  PaymentInstruction,
  BatchResult,
  JobStatus,
} from "@/lib/stellar/types";
import { useBatchHistory } from "@/hooks/use-batch-history";

type PageState = "upload" | "preview" | "polling" | "results";

interface PollResponse {
  jobId: string;
  status: JobStatus;
  totalBatches: number;
  completedBatches: number;
  totalPayments: number;
  network: "testnet" | "mainnet";
  result?: BatchResult;
  error?: string;
}

const POLL_INTERVAL_MS = 2000;

export default function Home() {
  const [state, setState] = useState<PageState>("upload");
  const [payments, setPayments] = useState<PaymentInstruction[]>([]);
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Async job tracking
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollData, setPollData] = useState<PollResponse | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { saveResult } = useBatchHistory();

  /** Stop the polling interval if one is running. */
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  /** Poll the status endpoint and handle terminal states. */
  const pollStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/batch-status/${id}`);
      if (!res.ok) {
        throw new Error(`Status check failed (${res.status})`);
      }
      const data: PollResponse = await res.json();
      setPollData(data);

      if (data.status === "completed" && data.result) {
        stopPolling();
        saveResult(data.result);
        setResult(data.result);
        setState("results");
        setIsLoading(false);
      } else if (data.status === "failed") {
        stopPolling();
        setError(data.error ?? "Batch processing failed");
        setState("preview");
        setIsLoading(false);
      }
    } catch (err) {
      // Don't stop polling on transient network errors — just log
      console.warn("Poll error (will retry):", err);
    }
  };

  /** Cleanup on unmount. */
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const handleFileSelect = async (file: File, format: "json" | "csv") => {
    try {
      setError("");
      const content = await file.text();
      const parsed = parseInput(content, format);

      const validation = validatePaymentInstructions(parsed);
      if (!validation.valid) {
        const errors = Array.from(validation.errors.values()).slice(0, 3);
        throw new Error(`Invalid payments: ${errors.join(", ")}`);
      }

      setPayments(parsed);
      setState("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  const handleExecute = async () => {
    try {
      setError("");
      setIsLoading(true);
      setPollData(null);
      setJobId(null);

      const response = await fetch("/api/batch-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payments, network }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Batch submission failed");
      }

      const { jobId: newJobId } = await response.json();
      setJobId(newJobId);
      setState("polling");

      // Start polling immediately, then on interval
      await pollStatus(newJobId);
      pollIntervalRef.current = setInterval(
        () => pollStatus(newJobId),
        POLL_INTERVAL_MS,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch submission failed");
      setState("preview");
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    stopPolling();
    setPayments([]);
    setResult(null);
    setError("");
    setJobId(null);
    setPollData(null);
    setState("upload");
    setIsLoading(false);
  };

  const handleRetry = (failedPayments: PaymentInstruction[]) => {
    stopPolling();
    setPayments(failedPayments);
    setResult(null);
    setError("");
    setState("preview");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Stellar BatchPay</h1>
          <p className="text-muted-foreground">
            Send multiple payments on the Stellar blockchain—fast, simple, and
            secure. Process bulk payments in seconds.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4 mb-6">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* ── Upload ────────────────────────────────────────────────── */}
        {state === "upload" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Upload Payment File
              </h2>
              <FileUpload onFileSelect={handleFileSelect} />
            </div>
          </div>
        )}

        {/* ── Preview ───────────────────────────────────────────────── */}
        {state === "preview" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Batch Preview</h2>
              <BatchSummary payments={payments} />
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Network Selection</h3>
              <div className="flex gap-4">
                {(["testnet", "mainnet"] as const).map((net) => (
                  <label
                    key={net}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="network"
                      value={net}
                      checked={network === net}
                      onChange={(e) =>
                        setNetwork(e.target.value as "testnet" | "mainnet")
                      }
                      className="w-4 h-4"
                    />
                    <span className="capitalize text-foreground">{net}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Make sure your account has sufficient balance on the selected
                network.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleExecute}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Submitting…" : "Submit Batch"}
              </Button>
              <Button onClick={handleReset} variant="outline">
                Change File
              </Button>
            </div>
          </div>
        )}

        {/* ── Polling / Progress ────────────────────────────────────── */}
        {state === "polling" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Processing Batch</h2>

              <JobProgress
                status={pollData?.status ?? "queued"}
                completedBatches={pollData?.completedBatches ?? 0}
                totalBatches={pollData?.totalBatches ?? 0}
                totalPayments={payments.length}
              />

              {jobId && (
                <p className="text-xs text-muted-foreground mt-6 font-mono">
                  Job ID: {jobId}
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                You can safely leave this page. Come back and paste your Job ID
                to resume tracking. (Coming soon)
              </p>
            </div>

            <Button onClick={handleReset} variant="outline" className="w-full">
              Cancel & Start Over
            </Button>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────── */}
        {state === "results" && result && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Batch Results</h2>
              <ResultsDisplay result={result} onRetry={handleRetry} />
            </div>

            <Button onClick={handleReset} className="w-full">
              Submit New Batch
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
