/**
 * API route for fetching dashboard metrics for a connected wallet.
 *
 * GET /api/dashboard-metrics?publicKey=<publicKey>&network=<testnet|mainnet>
 *
 * Optional query: range=7d|30d|90d adds a `timeSeries` field bucketing the
 * account's payment volume into daily buckets for the requested window. The
 * `/dashboard/analytics` page consumes this for the PaymentVolumeChart.
 *
 * Queries Horizon for the account's operations and aggregates metrics.
 */

import { NextRequest, NextResponse } from "next/server";
import { Horizon } from "stellar-sdk";

type TimeRange = "7d" | "30d" | "90d";

interface TimeSeriesPoint {
  date: string; // ISO yyyy-mm-dd
  amount: number; // XLM amount sent on that day
}

function rangeToDays(range: TimeRange | null): number | null {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const publicKey = searchParams.get("publicKey");
  const network = searchParams.get("network");
  const rangeParam = searchParams.get("range") as TimeRange | null;

  if (!publicKey || typeof publicKey !== "string") {
    return NextResponse.json(
      { error: "Missing required query parameter: publicKey" },
      { status: 400 },
    );
  }

  if (network !== "testnet" && network !== "mainnet") {
    return NextResponse.json(
      { error: "network must be 'testnet' or 'mainnet'" },
      { status: 400 },
    );
  }

  if (rangeParam && rangeToDays(rangeParam) === null) {
    return NextResponse.json(
      { error: "range must be one of: 7d, 30d, 90d" },
      { status: 400 },
    );
  }

  const serverUrl =
    network === "testnet"
      ? "https://horizon-testnet.stellar.org"
      : "https://horizon.stellar.org";
  const server = new Horizon.Server(serverUrl);

  try {
    // Get account operations (limit to recent 200 for performance)
    const operations = await server
      .operations()
      .forAccount(publicKey)
      .limit(200)
      .order("desc")
      .call();

    let totalPayments = 0;
    let totalAmountSent = 0; // in XLM display units (Horizon returns decimal strings)
    let assetCounts: { [key: string]: number } = {};
    let successfulPayments = 0;

    // Process operations
    for (const op of operations.records) {
      if (op.type === "payment" && op.source_account === publicKey) {
        totalPayments += 1;
        successfulPayments += 1; // All operations in the response are successful

        // Handle amount based on asset type
        if (op.asset_type === "native") {
          // Horizon returns amount as a human-readable decimal (e.g. "10.5000000") — no conversion needed
          totalAmountSent += parseFloat(op.amount);
          assetCounts["XLM"] = (assetCounts["XLM"] || 0) + parseFloat(op.amount);
        } else {
          // Issued asset
          const assetKey = `${op.asset_code}:${op.asset_issuer}`;
          assetCounts[assetKey] = (assetCounts[assetKey] || 0) + parseFloat(op.amount);
          // For total amount, we could convert to USD, but for now just count
        }
      }
    }

    // Calculate success rate
    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    // Active batches: rough estimate based on recent activity
    // Group payments by time windows (e.g., last 24 hours)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    let recentPayments = 0;

    for (const op of operations.records) {
      if (op.type === "payment" && op.source_account === publicKey) {
        const opTime = new Date(op.created_at).getTime();
        if (opTime > oneDayAgo) {
          recentPayments += 1;
        }
      }
    }

    // Estimate active batches (assume 10 payments per batch)
    const activeBatches = Math.max(1, Math.floor(recentPayments / 10));

    // Format total amount (prioritize XLM, otherwise show asset breakdown)
    let totalAmountDisplay = "";
    if (assetCounts["XLM"]) {
      totalAmountDisplay = `${assetCounts["XLM"].toFixed(2)} XLM`;
    } else {
      // Show first asset
      const firstAsset = Object.keys(assetCounts)[0];
      if (firstAsset) {
        totalAmountDisplay = `${assetCounts[firstAsset].toFixed(2)} ${firstAsset}`;
      } else {
        totalAmountDisplay = "0";
      }
    }

    // Optional time-series for the analytics chart (#359)
    let timeSeries: TimeSeriesPoint[] | undefined;
    const days = rangeToDays(rangeParam);
    if (days !== null) {
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      const buckets = new Map<string, number>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        buckets.set(key, 0);
      }
      for (const op of operations.records) {
        if (op.type !== "payment" || op.source_account !== publicKey) continue;
        const ts = new Date(op.created_at).getTime();
        if (ts < cutoff) continue;
        const key = new Date(op.created_at).toISOString().slice(0, 10);
        if (!buckets.has(key)) continue;
        const amount = op.asset_type === "native" ? parseFloat(op.amount) : 0;
        buckets.set(key, (buckets.get(key) ?? 0) + amount);
      }
      timeSeries = Array.from(buckets.entries()).map(([date, amount]) => ({
        date,
        amount: Number(amount.toFixed(7)),
      }));
    }

    return NextResponse.json({
      totalPayments,
      totalAmountSent: totalAmountDisplay,
      successRate: successRate.toFixed(1) + "%",
      activeBatches,
      ...(timeSeries ? { timeSeries, range: rangeParam } : {}),
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics from Horizon" },
      { status: 500 },
    );
  }
}
