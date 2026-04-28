/**
 * API route for submitting a pre-signed Stellar transaction with dynamic fee handling.
 *
 * POST /api/batch-submit-signed
 *
 * Accepts { signedXdr, network } where signedXdr is the base64-encoded
 * XDR of a transaction that has already been signed by the user's wallet.
 */

import { NextRequest, NextResponse } from "next/server";
import { TransactionBuilder, Horizon, Networks } from "stellar-sdk";
import { safeJsonResponse } from "@/lib/safe-json";
import { fetchFeeStats } from "@/lib/stellar/fee-service";

interface RequestBody {
    signedXdr: string;
    network: "testnet" | "mainnet";
}

function isFeeError(error: unknown): boolean {
    if (
        error &&
        typeof error === "object" &&
        "response" in error
    ) {
        const errorObj = error as { response?: { data?: { extras?: unknown } } };
        const extras = errorObj.response?.data?.extras as {
            result_codes?: {
                transaction?: string;
            };
        } | undefined;

        // Fee-related result codes from Stellar:
        // - tx_too_late: fee threshold reached
        // - tx_bad_seq: sequence number issue (can happen with network congestion)
        const txCode = extras?.result_codes?.transaction;
        return (
            txCode === "tx_too_late" ||
            txCode === "tx_failed" ||
            (error instanceof Error &&
                error.message.includes("insufficient fee"))
        );
    }
    return false;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as RequestBody;
        const { signedXdr, network } = body;

        // ── Validate inputs ──────────────────────────────────────────

        if (!signedXdr || typeof signedXdr !== "string") {
            return NextResponse.json(
                { error: "signedXdr is required" },
                { status: 400 },
            );
        }

        if (!["testnet", "mainnet"].includes(network)) {
            return NextResponse.json(
                { error: "network must be 'testnet' or 'mainnet'" },
                { status: 400 },
            );
        }

        // ── Rehydrate and submit ─────────────────────────────────────

        const networkPassphrase =
            network === "testnet" ? Networks.TESTNET : Networks.PUBLIC;

        const transaction = TransactionBuilder.fromXDR(
            signedXdr,
            networkPassphrase,
        );

        const serverUrl =
            network === "testnet"
                ? "https://horizon-testnet.stellar.org"
                : "https://horizon.stellar.org";
        const server = new Horizon.Server(serverUrl);

        // Fetch current network fee stats for diagnostic feedback
        let currentFeeStats;
        try {
            currentFeeStats = await fetchFeeStats(server);
        } catch (err) {
            console.warn("Failed to fetch fee stats:", err);
        }

        const result = await server.submitTransaction(transaction);

        return safeJsonResponse({
            success: true,
            hash: result.hash,
            ledger: result.ledger,
        });
    } catch (error: unknown) {
        console.error("Submit signed tx error:", error);

        const serverUrl =
            (request.nextUrl.searchParams.get("network") || "testnet") === "testnet"
                ? "https://horizon-testnet.stellar.org"
                : "https://horizon.stellar.org";
        const server = new Horizon.Server(serverUrl);

        // Check if this is a fee-related error
        const isFeeIssue = isFeeError(error);
        let recommendedFeeStats;

        if (isFeeIssue) {
            try {
                recommendedFeeStats = await fetchFeeStats(server);
            } catch (err) {
                console.warn("Failed to fetch recommended fee stats:", err);
            }
        }

        // Extract Horizon-specific error details if available
        const horizonExtras =
            error && typeof error === "object" && "response" in error
                ? (error as { response?: { data?: { extras?: { result_codes?: unknown } } } })
                    .response?.data?.extras?.result_codes
                : undefined;

        return safeJsonResponse(
            {
                success: false,
                error:
                    error instanceof Error ? error.message : "Transaction submission failed",
                resultCodes: horizonExtras,
                isFeeIssue,
                recommendedFeeStats: isFeeIssue ? recommendedFeeStats : undefined,
                hint: isFeeIssue
                    ? "Transaction failed due to insufficient fees. Current network fees are higher. Please sign and resubmit with a higher fee."
                    : undefined,
            },
            { status: 400 },
        );
    }
}
