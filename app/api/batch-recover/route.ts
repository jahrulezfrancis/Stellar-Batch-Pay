/**
 * API route for recovering failed batch operations.
 *
 * POST /api/batch-recover
 *
 * Accepts { jobId, originalPayments, previousResults } and returns
 * the subset of operations that need retry, enabling partial batch recovery.
 */

import { NextRequest, NextResponse } from "next/server";
import { loadFailedBatchOperations, canResumeBatch } from "@/lib/batch-recovery";
import { safeJsonResponse } from "@/lib/safe-json";
import type { PaymentInstruction, PaymentResult } from "@/lib/stellar/types";

interface RecoveryRequest {
  jobId: string;
  originalPayments: PaymentInstruction[];
  previousResults: PaymentResult[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RecoveryRequest;
    const { jobId, originalPayments, previousResults } = body;

    // Validate inputs
    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(originalPayments) || originalPayments.length === 0) {
      return NextResponse.json(
        { error: "originalPayments is required and must not be empty" },
        { status: 400 },
      );
    }

    if (!Array.isArray(previousResults) || previousResults.length === 0) {
      return NextResponse.json(
        { error: "previousResults is required and must not be empty" },
        { status: 400 },
      );
    }

    // Load batch state and extract failed operations
    const failedBatch = await loadFailedBatchOperations(
      jobId,
      originalPayments,
      previousResults,
    );

    if (!failedBatch) {
      return safeJsonResponse({
        canResume: false,
        message: "Batch not found in recovery store. Cannot resume.",
      });
    }

    if (failedBatch.failedOperations.length === 0) {
      return safeJsonResponse({
        canResume: false,
        message: "No failed operations to retry. All payments were successful.",
      });
    }

    // Check if batch can still be resumed
    const canResume = await canResumeBatch(jobId);

    return safeJsonResponse({
      canResume,
      jobId,
      network: failedBatch.network,
      failedCount: failedBatch.failedOperations.length,
      successfulCount: originalPayments.length - failedBatch.failedOperations.length,
      failedOperations: failedBatch.failedOperations,
      hint: canResume
        ? "You can retry the failed operations. Sign with the same key to resubmit."
        : "Batch recovery window may have expired. Create a new batch to retry.",
    });
  } catch (error) {
    console.error("Batch recovery error:", error);

    return safeJsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Failed to recover batch",
        canResume: false,
      },
      { status: 400 },
    );
  }
}
