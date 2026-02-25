"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { BatchSummary } from "@/components/batch-summary";
import { ResultsDisplay } from "@/components/results-display";
import { JobProgress } from "@/components/job-progress";
import { ConnectWalletButton } from "@/components/connect-wallet-button";
import { useFreighter } from "@/hooks/use-freighter";
import { parseInput, parseFileStream, validatePaymentInstructions } from "@/lib/stellar";
import type {
  PaymentInstruction,
  BatchResult,
  PaymentResult,
  JobStatus,
} from "@/lib/stellar/types";
import { useBatchHistory } from "@/hooks/use-batch-history";

type PageState = "upload" | "parsing" | "preview" | "signing" | "results";

const MAX_OPS = 100;

export default function Home() {
  const [state, setState] = useState<PageState>("upload");
  const [payments, setPayments] = useState<PaymentInstruction[]>([]);
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [parsedCount, setParsedCount] = useState<number>(0);

  // Signing progress
  const [signingProgress, setSigningProgress] = useState({
    current: 0,
    total: 0,
    phase: "building" as "building" | "signing" | "submitting",
  });

  const { saveResult } = useBatchHistory();
  const { publicKey, signTx } = useFreighter();

  const handleFileSelect = async (file: File, format: "json" | "csv") => {
    try {
      setError("");

      if (format === "csv") {
        setState("parsing");
        setParsedCount(0);

        parseFileStream(file, {
          onProgress: (count) => {
            setParsedCount(count);
          },
          onComplete: (parsed) => {
            setPayments(parsed);
            setState("preview");
          },
          onError: (err) => {
            setError(err.message);
            setState("upload");
          }
        });

      } else {
        const content = await file.text();
        const parsed = parseInput(content, format);

        const validation = validatePaymentInstructions(parsed);
        if (!validation.valid) {
          const errors = Array.from(validation.errors.values()).slice(0, 3);
          throw new Error(`Invalid payments: ${errors.join(", ")}`);
        }

        setPayments(parsed);
        setState("preview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
      setState("upload");
    }
  };

  /**
   * New wallet-based execute flow:
   * 1. POST /api/batch-build → get unsigned XDRs
   * 2. Sign each XDR via Freighter
   * 3. POST /api/batch-submit-signed → submit each signed XDR
   */
  const handleExecute = async () => {
    if (!publicKey) {
      setError("Please connect your Freighter wallet first.");
      return;
    }

    try {
      setError("");
      setIsLoading(true);
      setState("signing");
      setSigningProgress({ current: 0, total: 0, phase: "building" });

      // ── Step 1: Build unsigned XDRs ──────────────────────────
      const buildRes = await fetch("/api/batch-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payments, network, publicKey }),
      });

      if (!buildRes.ok) {
        const data = await buildRes.json();
        throw new Error(data.error || "Failed to build transactions");
      }

      const { xdrs, batchCount } = await buildRes.json();
      setSigningProgress({ current: 0, total: batchCount, phase: "signing" });

      // ── Step 2+3: Sign and submit each XDR ──────────────────
      const allResults: PaymentResult[] = [];
      let successCount = 0;
      let failCount = 0;
      const startTime = new Date().toISOString();

      // Calculate payments per batch for result attribution
      const paymentsPerBatch = Math.min(MAX_OPS, payments.length);

      for (let i = 0; i < xdrs.length; i++) {
        const xdr = xdrs[i];
        const batchStart = i * paymentsPerBatch;
        const batchEnd = Math.min(batchStart + paymentsPerBatch, payments.length);
        const batchPayments = payments.slice(batchStart, batchEnd);

        try {
          // Sign via Freighter
          setSigningProgress((prev) => ({ ...prev, phase: "signing", current: i }));
          const signedXdr = await signTx(xdr, network);

          // Submit the signed transaction
          setSigningProgress((prev) => ({ ...prev, phase: "submitting" }));
          const submitRes = await fetch("/api/batch-submit-signed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ signedXdr, network }),
          });

          const submitData = await submitRes.json();

          if (submitData.success) {
            for (const payment of batchPayments) {
              allResults.push({
                recipient: payment.address,
                amount: payment.amount,
                asset: payment.asset,
                status: "success",
                transactionHash: submitData.hash,
              });
              successCount++;
            }
          } else {
            for (const payment of batchPayments) {
              allResults.push({
                recipient: payment.address,
                amount: payment.amount,
                asset: payment.asset,
                status: "failed",
                error: submitData.error || "Submission failed",
              });
              failCount++;
            }
          }
        } catch (err) {
          // User rejected signing or other error
          const errMsg = err instanceof Error ? err.message : "Signing failed";

          // If user rejected, stop the loop
          if (errMsg.toLowerCase().includes("user") || errMsg.toLowerCase().includes("reject") || errMsg.toLowerCase().includes("cancel")) {
            for (const payment of batchPayments) {
              allResults.push({
                recipient: payment.address,
                amount: payment.amount,
                asset: payment.asset,
                status: "failed",
                error: "Signing cancelled by user",
              });
              failCount++;
            }
            // Mark remaining batches as cancelled too
            for (let j = i + 1; j < xdrs.length; j++) {
              const rStart = j * paymentsPerBatch;
              const rEnd = Math.min(rStart + paymentsPerBatch, payments.length);
              for (const payment of payments.slice(rStart, rEnd)) {
                allResults.push({
                  recipient: payment.address,
                  amount: payment.amount,
                  asset: payment.asset,
                  status: "failed",
                  error: "Signing cancelled by user",
                });
                failCount++;
              }
            }
            break;
          }

          for (const payment of batchPayments) {
            allResults.push({
              recipient: payment.address,
              amount: payment.amount,
              asset: payment.asset,
              status: "failed",
              error: errMsg,
            });
            failCount++;
          }
        }

        setSigningProgress((prev) => ({ ...prev, current: i + 1 }));
      }

      // ── Build final result ────────────────────────────────────
      const totalAmount = payments.reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0,
      );

      const finalResult: BatchResult = {
        batchId: `batch-${Date.now()}`,
        totalRecipients: payments.length,
        totalAmount: totalAmount.toString(),
        totalTransactions: xdrs.length,
        network,
        timestamp: startTime,
        submittedAt: new Date().toISOString(),
        results: allResults,
        summary: {
          successful: successCount,
          failed: failCount,
        },
      };

      saveResult(finalResult);
      setResult(finalResult);
      setState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch submission failed");
      setState("preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPayments([]);
    setResult(null);
    setError("");
    setState("upload");
    setIsLoading(false);
    setSigningProgress({ current: 0, total: 0, phase: "building" });
  };

  const handleRetry = (failedPayments: PaymentInstruction[]) => {
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
            secure. Connect your Freighter wallet to sign transactions safely.
          </p>
        </div>

        {/* ── Wallet Connection ───────────────────────────────────── */}
        <div className="mb-6 bg-card border border-border rounded-lg p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {publicKey ? "Wallet connected" : "Connect your wallet to get started"}
          </div>
          <ConnectWalletButton />
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

        {/* ── Parsing ───────────────────────────────────────────────── */}
        {state === "parsing" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6 py-12 text-center">
              <h2 className="text-xl font-semibold mb-4 text-primary animate-pulse">Parsing File...</h2>
              <div className="text-4xl font-mono mb-2">{parsedCount.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Rows processed</p>
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
                disabled={isLoading || !publicKey}
                className="flex-1"
                title={!publicKey ? "Connect your Freighter wallet first" : undefined}
              >
                {isLoading
                  ? "Processing…"
                  : !publicKey
                    ? "Connect Wallet to Submit"
                    : "Sign & Submit Batch"}
              </Button>
              <Button onClick={handleReset} variant="outline">
                Change File
              </Button>
            </div>

            {!publicKey && (
              <p className="text-xs text-center text-amber-400">
                ⚠ You must connect your Freighter wallet before submitting.
              </p>
            )}
          </div>
        )}

        {/* ── Signing / Progress ────────────────────────────────────── */}
        {state === "signing" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">
                {signingProgress.phase === "building"
                  ? "Building Transactions…"
                  : signingProgress.phase === "signing"
                    ? "Waiting for Signature…"
                    : "Submitting to Network…"}
              </h2>

              {signingProgress.total > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Batch {signingProgress.current} of {signingProgress.total}
                    </span>
                    <span>
                      {Math.round(
                        (signingProgress.current / signingProgress.total) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                      style={{
                        width: `${(signingProgress.current / signingProgress.total) * 100
                          }%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {signingProgress.phase === "building" && (
                <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="text-sm">Building unsigned transactions…</span>
                </div>
              )}

              {signingProgress.phase === "signing" && (
                <div className="mt-6 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-sm text-indigo-300 text-center">
                    🔐 Please approve the transaction in your Freighter wallet
                  </p>
                </div>
              )}

              {signingProgress.phase === "submitting" && (
                <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="text-sm">Submitting signed transaction…</span>
                </div>
              )}
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
