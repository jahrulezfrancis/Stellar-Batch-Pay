/**
 * API route for polling batch job status.
 *
 * GET /api/batch-status/:jobId
 *
 * Returns the current state of a queued/processing/completed batch job.
 * Frontend polls this endpoint every ~2 seconds to drive the progress bar.
 */

import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/job-store";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json(
      { error: "Missing jobId parameter" },
      { status: 400 },
    );
  }

  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: `Job not found: ${jobId}` },
      { status: 404 },
    );
  }

  // Return a safe, minimal response — no need to echo back the full payments array
  return NextResponse.json({
    jobId: job.jobId,
    status: job.status,
    totalBatches: job.totalBatches,
    completedBatches: job.completedBatches,
    totalPayments: job.payments.length,
    network: job.network,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    // Only present when status === 'completed'
    result: job.result,
    // Only present when status === 'failed'
    error: job.error,
  });
}
