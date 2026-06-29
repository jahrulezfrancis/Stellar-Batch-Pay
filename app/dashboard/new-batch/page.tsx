"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { DashboardWalletEmpty } from "@/components/dashboard/dashboard-wallet-empty";
import { MotionSafe } from "@/components/motion-safe";
import { motionCssDuration, stepEnter } from "@/lib/motion-tokens";
import { BatchDryRun } from "@/components/dashboard/BatchDryRun";
import { CsvValidationErrors } from "@/components/csv-validation-errors";
import { JobProgress } from "@/components/job-progress";
import { ResultsDisplay } from "@/components/results-display";
import { useWallet } from "@/contexts/WalletContext";
import {
  Check,
  Lightbulb,
  AlertCircle,
  BookOpen,
  UserPlus,
  FileUp,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualBatchEntry } from "@/components/dashboard/ManualBatchEntry";
import { BatchReview } from "@/components/dashboard/BatchReview";
import Link from "next/link";
import { BatchErrorBoundary } from "@/components/BatchErrorBoundary";
import { canonicalizeIdempotencyPayload } from "@/lib/idempotency";

const NEW_BATCH_STATE_KEY = "new_batch_state";

async function buildBatchSubmitIdempotencyKey(body: {
  payments?: PaymentInstruction[];
  network: "testnet" | "mainnet";
  publicKey: string;
}) {
  const canonicalBody = canonicalizeIdempotencyPayload({
    payments: body.payments ?? null,
    network: body.network,
    publicKey: body.publicKey,
  });

  const webCrypto = globalThis.crypto;

  if (!webCrypto?.subtle) {
    return webCrypto?.randomUUID() ?? `${Date.now()}-${Math.random()}`;
  }

  const encoded = new TextEncoder().encode(canonicalBody);
  const digest = await webCrypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function NewBatchPaymentPage() {
  const [step, setStep] = useState(1);
  const [selectedNetwork, setSelectedNetwork] = useState<"testnet" | "mainnet">(
    "testnet",
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<"json" | "csv" | null>(null);
  const [validationResult, setValidationResult] =
    useState<ParsedPaymentFile | null>(null);
  const [validationError, setValidationError] = useState("");
  const [summary, setSummary] = useState<{
    recipientCount: number;
    validCount: number;
    invalidCount: number;
    totalAmount: string;
    assetBreakdown: Record<string, number>;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>("queued");
  const [completedBatches, setCompletedBatches] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [manualPayments, setManualPayments] = useState<PaymentInstruction[]>(
    [],
  );
  const [entryMode, setEntryMode] = useState<"upload" | "manual">("upload");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasLoadedSavedStateRef = useRef(false);

  // Store only non-sensitive flow metadata. Recipient addresses, amounts, and
  // validation details must never be persisted in browser storage.
  useEffect(() => {
    if (!hasLoadedSavedStateRef.current) return;

    if (result || jobStatus === "completed") {
      sessionStorage.removeItem(NEW_BATCH_STATE_KEY);
      return;
    }

    const stateToSave = {
      step: jobId ? step : 1,
      selectedNetwork,
      entryMode,
      jobId,
      jobStatus,
    };

    sessionStorage.setItem(NEW_BATCH_STATE_KEY, JSON.stringify(stateToSave));
  }, [
    step,
    selectedNetwork,
    entryMode,
    jobId,
    jobStatus,
    result,
  ]);

  // Restore state from sessionStorage
  const handleRestore = (saved: any) => {
    if (saved.selectedNetwork) setSelectedNetwork(saved.selectedNetwork);
    if (saved.entryMode) setEntryMode(saved.entryMode);
    if (saved.jobId) {
      setJobId(saved.jobId);
      setJobStatus(saved.jobStatus ?? "queued");
      setStep(saved.step ?? 4);
    } else {
      setStep(1);
      setValidationResult(null);
      setSummary(null);
      setManualPayments([]);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(NEW_BATCH_STATE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        handleRestore(parsed);
      } catch (e) {
        console.error("Failed to restore new_batch_state:", e);
        sessionStorage.removeItem(NEW_BATCH_STATE_KEY);
      } finally {
        hasLoadedSavedStateRef.current = true;
      }
    } else {
      hasLoadedSavedStateRef.current = true;
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (id: string, ownerPublicKey: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const params = new URLSearchParams({ publicKey: ownerPublicKey });
          const res = await fetch(
            `/api/batch-status/${id}?${params.toString()}`,
          );
          if (!res.ok) return;
          const data = await res.json();
          setJobStatus(data.status);
          setCompletedBatches(data.completedBatches ?? 0);
          setTotalBatches(data.totalBatches ?? 0);
          if (data.status === "completed") {
            stopPolling();
            setResult(data.result ?? null);
            setIsSubmitting(false);
            setStep(4);
            sessionStorage.removeItem(NEW_BATCH_STATE_KEY);
            toast.success("Batch submitted successfully");
          } else if (data.status === "failed") {
            stopPolling();
            setIsSubmitting(false);
            toast.error(data.error ?? "Batch processing failed");
          }
        } catch {
          // ignore transient fetch errors
        }
      }, 2000);
    },
    [stopPolling],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (!jobId || !publicKey || isSubmitting || result) return;
    if (jobStatus === "completed" || jobStatus === "failed") return;

    setIsSubmitting(true);
    startPolling(jobId, publicKey);
  }, [jobId, publicKey, isSubmitting, result, jobStatus, startPolling]);

  const [skippedIndices, setSkippedIndices] = useState<number[]>([]);
  const [convertedIndices, setConvertedIndices] = useState<number[]>([]);
  const [batchMeta, setBatchMeta] = useState<BatchMetaEntry[] | undefined>();
  const [batchMetaLoading, setBatchMetaLoading] = useState(false);
  const { publicKey, signTx } = useWallet();
  const allowServerSigning =
    process.env.NEXT_PUBLIC_ALLOW_SERVER_SIGNING === "true";

  const loadBatchMeta = useCallback(
    async (payments: PaymentInstruction[]) => {
      if (!publicKey || payments.length === 0) {
        setBatchMeta(undefined);
        return;
      }

      setBatchMetaLoading(true);
      try {
        const response = await fetch("/api/batch-build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payments,
            network: selectedNetwork,
            publicKey,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          setBatchMeta(data.batchMeta);
        } else {
          setBatchMeta(undefined);
        }
      } catch {
        setBatchMeta(undefined);
      } finally {
        setBatchMetaLoading(false);
      }
    },
    [publicKey, selectedNetwork],
  );

  const handleSkipToggle = (index: number) => {
    setSkippedIndices((prev) => {
      const next = [...prev];
      const idx = next.indexOf(index);
      if (idx >= 0) {
        next.splice(idx, 1);
      } else {
        next.push(index);
      }
      return next;
    });
  };

  const handleConvertToggle = (index: number) => {
    setConvertedIndices((prev) => {
      const next = [...prev];
      const idx = next.indexOf(index);
      if (idx >= 0) {
        next.splice(idx, 1);
      } else {
        next.push(index);
      }
      return next;
    });
  };

  const handleRetryFailed = (failedPayments: PaymentInstruction[]) => {
    const rows = failedPayments.map((instruction, index) => ({
      rowNumber: index + 1,
      instruction,
      valid: true,
    }));

    setValidationResult({
      rows,
      validPayments: failedPayments,
      invalidCount: 0,
    });
    setSummary(getBatchSummary(failedPayments));
    setSkippedIndices([]);
    setConvertedIndices([]);
    setStep(2);
    toast.success(
      "Loaded failed payments for retry. Review before resubmitting.",
    );
  };

  // UX: Warn before closing tab during submission (#287)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitting]);

  const steps = [
    { id: 1, name: t("newBatch.stepUpload") },
    { id: 2, name: t("newBatch.stepValidate") },
    { id: 3, name: t("newBatch.stepReview") },
    { id: 4, name: t("newBatch.stepSubmit") },
  ];

  const canNavigateToStep = (targetStep: number): boolean => {
    if (targetStep === step) return true;
    if (targetStep === 1) return true;
    if (targetStep === 2) return step >= 2 && !!validationResult;
    if (targetStep === 3) return step >= 3 && !!validationResult;
    if (targetStep === 4) return step >= 4;
    return false;
  };

  const handleStepClick = (targetStep: number) => {
    if (canNavigateToStep(targetStep)) {
      setStep(targetStep);
    }
  };

  const displayFees = estimatedFees
    ? estimatedFees
    : summary
      ? (summary.validCount * 0.0001).toFixed(4)
      : "0.0000";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-slate-400 hover:text-white">
          Dashboard
        </Link>
        <span className="text-slate-600">›</span>
        <span className="text-emerald-500">{t("newBatch.title")}</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {t("newBatch.title")}
        </h1>
        <p className="text-slate-400">{t("newBatch.description")}</p>
      </div>

      {/* Wallet Connection */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {publicKey
            ? "Wallet connected"
            : "Connect your wallet to get started"}
        </div>
        <ConnectWalletButton />
      </div>

      <BatchErrorBoundary
        storageKey={NEW_BATCH_STATE_KEY}
        onRestore={handleRestore}
      >
        {/* Stepper */}
        <div className="mb-8 pt-4">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-800 -z-10" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 -z-10 transition-all duration-300"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((s) => (
              <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 -z-10 transition-all ${motionCssDuration.fast}`}
                style={{
                  width: `${((step - 1) / (steps.length - 1)) * 100}%`,
                }}
              />
              {steps.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col items-center gap-2 bg-[#0B0F1A] px-2 md:px-4"
                >
                  <button
                    type="button"
                    aria-label={`Step ${s.id}: ${s.name}`}
                    aria-current={step === s.id ? "step" : undefined}
                    disabled={
                      step < s.id &&
                      s.id > 1 &&
                      (!validationResult || !summary)
                    }
                    onClick={() => handleStepClick(s.id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2 outline-hidden disabled:cursor-not-allowed ${
                      step > s.id
                        ? "bg-emerald-500 border-emerald-500 text-white cursor-pointer hover:bg-emerald-600"
                        : step === s.id
                          ? "bg-[#0B0F1A] border-emerald-500 text-emerald-500"
                          : "bg-[#0B0F1A] border-slate-700 text-slate-500"
                    }`}
                  >
                    {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                  </button>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      step >= s.id ? "text-emerald-500" : "text-slate-500"
                    }`}
                  >
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {step === 1 && (
            <MotionSafe
              {...stepEnter}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-6">
                <Tabs
                  value={entryMode}
                  onValueChange={(v) => setEntryMode(v as "upload" | "manual")}
                >
                  <TabsList className="bg-slate-900 border-slate-800 mb-4 p-1">
                    <TabsTrigger
                      value="upload"
                      className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                    >
                      <FileUp className="w-4 h-4 mr-2" />
                      {t("newBatch.fileUpload")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="manual"
                      className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {t("newBatch.manualEntry")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload">
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardHeader>
                        <CardTitle className="text-xl text-white">
                          {t("newBatch.uploadPaymentFile")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FileUpload onFileSelect={handleFileSelect} />
                        {file && (
                          <div className="mt-4 text-sm text-slate-400">
                            Selected:
                            <span className="text-white font-medium">
                              {" "}
                              {file.name}
                            </span>
                            {fileFormat && (
                              <span className="ml-2 text-emerald-500">
                                ({fileFormat.toUpperCase()})
                              </span>
                            )}
                          </div>
                        )}
                        {validationError && (
                          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                            {validationError}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={() => setStep(2)}
                        disabled={!validationResult || !summary}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto px-8"
                      >
                        {t("newBatch.continueToValidation")}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="manual">
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardHeader>
                        <CardTitle className="text-xl text-white">
                          {t("newBatch.manualRecipientEntry")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ManualBatchEntry
                          initialPayments={manualPayments}
                          onPaymentsChange={setManualPayments}
                        />
                      </CardContent>
                    </Card>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleManualContinue}
                        disabled={manualPayments.length === 0}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto px-8"
                      >
                        {t("newBatch.continueToValidation")}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-6">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <CardTitle className="text-lg text-white">
                        {t("newBatch.tipsTitle")}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-slate-400">{t("newBatch.tip1")}</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-slate-400">{t("newBatch.tip2")}</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-slate-400">{t("newBatch.tip3")}</p>
                    </div>
                    <button className="text-emerald-500 hover:text-emerald-400 text-sm flex items-center gap-1 mt-2">
                      <BookOpen className="w-3 h-3" />
                      View Documentation
                    </button>
                  </CardContent>
                </Card>
              </div>
            </MotionSafe>
          )}

          {step === 2 && summary && validationResult && (
            <MotionSafe {...stepEnter} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">
                        {t("newBatch.validationResults")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Check className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {t("newBatch.validRecipients")}
                            </div>
                            <div className="text-2xl font-bold text-emerald-500">
                              {summary.validCount}
                            </div>
                          </div>
                        </div>
                        {summary.invalidCount > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                              <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {t("newBatch.invalidRows")}
                              </div>
                              <div className="text-2xl font-bold text-red-500">
                                {summary.invalidCount}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                          <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                            {t("newBatch.totalAmount")}
                          </div>
                          <div className="text-xl font-bold text-white">
                            {summary.totalAmount} XLM
                          </div>
                        </div>
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                          <div className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                            {t("newBatch.estFees")}
                            {!estimatedFees && (
                              <span className="text-slate-600" title="Approximation based on 0.0001 XLM per payment. Click 'Review Batch' for accurate estimate using current network fees.">
                                (approx.)
                              </span>
                            )}
                          </div>
                          <div className="text-xl font-bold text-white">
                            {displayFees} XLM
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">
                        {t("common.next")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-400">
                        Review and confirm your batch payment before submitting
                        to the network.
                      </p>
                      <Button
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={async () => {
                          await loadBatchMeta(validationResult.validPayments);
                          setStep(3);
                        }}
                        disabled={summary.validCount === 0 || batchMetaLoading}
                      >
                        {batchMetaLoading
                          ? t("newBatch.estimatingBatchSize")
                          : t("newBatch.reviewBatch")}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {validationResult.invalidCount > 0 && (
                <CsvValidationErrors
                  validationResult={validationResult}
                  maxVisibleErrors={5}
                />
              )}

              <BatchDryRun result={validationResult} />
            </MotionSafe>
          )}

          {step === 3 && summary && validationResult && (
            <MotionSafe {...stepEnter} className="space-y-6">
              <BatchReview />
            </MotionSafe>
          )}

          {isSubmitting && jobId && (
            <MotionSafe {...stepEnter} className="space-y-4">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">
                    {t("newBatch.processingBatch")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <JobProgress
                    status={jobStatus}
                    completedBatches={completedBatches}
                    totalBatches={totalBatches}
                    totalPayments={validationResult?.validPayments.length ?? 0}
                  />
                </CardContent>
              </Card>
            </MotionSafe>
          )}

          {step === 4 && result && (
            <MotionSafe {...stepEnter} className="space-y-6">
              <ResultsDisplay result={result} />
              <div className="flex flex-wrap gap-3 pt-4">
                {jobId && (
                  <Button
                    onClick={() => {
                      sessionStorage.removeItem(NEW_BATCH_STATE_KEY);
                      setStep(1);
                      setResult(null);
                      setJobId(null);
                      setJobStatus("queued");
                    }}
                    variant="outline"
                    className="border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    <Link href={`/dashboard/history/${jobId}`}>
                      {t("history.viewDetails")}
                    </Link>
                  </Button>
                )}
                <Button
                  onClick={() => {
                    sessionStorage.removeItem("new_batch_state");
                    setStep(1);
                  }}
                  variant="outline"
                  className="border-slate-800 text-slate-300 hover:bg-slate-800"
                >
                  {t("newBatch.createNewBatch")}
                </Button>
              </div>
            </MotionSafe>
          )}
        </BatchErrorBoundary>
      )}
    </div>
  );
}

export default function NewBatchPaymentPage() {
  return (
    <BatchFlowProvider>
      <NewBatchPaymentPageContent />
    </BatchFlowProvider>
  );
}
