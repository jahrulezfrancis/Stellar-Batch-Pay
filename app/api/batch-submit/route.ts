/**
 * API route for submitting batch payments to Stellar (async / non-blocking).
 *
 * Returns 202 Accepted immediately with a jobId.
 * Frontend polls /api/batch-status/:jobId for progress.
 */

import { NextRequest, NextResponse } from "next/server";
import { validatePaymentInstructions } from "@/lib/stellar";
import { createJob } from "@/lib/job-store";
import { processJobInBackground } from "@/lib/stellar/batch-worker";
import type { PaymentInstruction } from "@/lib/stellar/types";

interface RequestBody {
  payments: PaymentInstruction[];
  network: "testnet" | "mainnet";
}

export async function POST(request: NextRequest) {
  try {
    // Get secret key from environment
    const secretKey = process.env.STELLAR_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "STELLAR_SECRET_KEY is not configured" },
        { status: 500 },
      );
    }

    // Parse request body
    const body = (await request.json()) as RequestBody;
    const { payments, network } = body;

    // Validate input
    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: payments must be a non-empty array" },
        { status: 400 },
      );
    }

    if (!["testnet", "mainnet"].includes(network)) {
      return NextResponse.json(
        { error: "Invalid network: must be 'testnet' or 'mainnet'" },
        { status: 400 },
      );
    }

    // Validate payments
    const validation = validatePaymentInstructions(payments);
    if (!validation.valid) {
      const errors = Array.from(validation.errors.entries())
        .map(([idx, err]) => `Row ${idx}: ${err}`)
        .slice(0, 5);
      return NextResponse.json(
        { error: `Invalid payment instructions: ${errors.join("; ")}` },
        { status: 400 },
      );
    }

    // Create a job in the store — returns a UUID immediately
    const jobId = createJob(payments, network);

    // Fire-and-forget: start background processing without awaiting
    void processJobInBackground(jobId, payments, network, secretKey);

    // Return 202 Accepted with the job ID for polling
    return NextResponse.json(
      {
        jobId,
        status: "queued",
        totalPayments: payments.length,
        message:
          "Batch queued for processing. Poll /api/batch-status/" +
          jobId +
          " for progress.",
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("Batch submission error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
