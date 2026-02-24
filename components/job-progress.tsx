"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { JobStatus } from "@/lib/stellar/types";

interface JobProgressProps {
  status: JobStatus;
  completedBatches: number;
  totalBatches: number;
  totalPayments: number;
}

export function JobProgress({
  status,
  completedBatches,
  totalBatches,
  totalPayments,
}: JobProgressProps) {
  const percent =
    totalBatches > 0 ? Math.round((completedBatches / totalBatches) * 100) : 0;

  const isQueued = status === "queued";
  const isProcessing = status === "processing";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {(isQueued || isProcessing) && (
          <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
        )}
        {isCompleted && (
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        )}
        {isFailed && <XCircle className="w-5 h-5 text-destructive shrink-0" />}

        <div className="min-w-0">
          {isQueued && (
            <p className="font-semibold text-muted-foreground">
              Queued — starting shortly…
            </p>
          )}
          {isProcessing && (
            <p className="font-semibold">
              Processing batch{" "}
              <span className="text-primary">{completedBatches}</span> of{" "}
              <span className="text-primary">{totalBatches}</span>
            </p>
          )}
          {isCompleted && (
            <p className="font-semibold text-green-600 dark:text-green-400">
              All {totalBatches} batch{totalBatches !== 1 ? "es" : ""}{" "}
              completed!
            </p>
          )}
          {isFailed && (
            <p className="font-semibold text-destructive">Processing failed</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalPayments} payment{totalPayments !== 1 ? "s" : ""} ·{" "}
            {totalBatches > 0
              ? `${totalBatches} Stellar transaction${totalBatches !== 1 ? "s" : ""}`
              : "Calculating…"}
          </p>
        </div>
      </div>

      {/* Progress bar — hidden while queued and totalBatches unknown */}
      {!isQueued && (
        <div className="space-y-2">
          <Progress
            value={isCompleted ? 100 : percent}
            className={`h-3 transition-all duration-500 ${
              isCompleted
                ? "[&>div]:bg-green-500"
                : isFailed
                  ? "[&>div]:bg-destructive"
                  : ""
            }`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{isCompleted ? 100 : percent}%</span>
            <span>
              {completedBatches} / {totalBatches} txn
              {totalBatches !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
