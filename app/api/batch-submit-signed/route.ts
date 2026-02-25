/**
 * API route for submitting a pre-signed Stellar transaction.
 *
 * POST /api/batch-submit-signed
 *
 * Accepts { signedXdr, network } where signedXdr is the base64-encoded
 * XDR of a transaction that has already been signed by the user's wallet.
 */

import { NextRequest, NextResponse } from "next/server";
import { TransactionBuilder, Horizon, Networks } from "stellar-sdk";

interface RequestBody {
    signedXdr: string;
    network: "testnet" | "mainnet";
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

        const result = await server.submitTransaction(transaction);

        return NextResponse.json({
            success: true,
            hash: result.hash,
            ledger: result.ledger,
        });
    } catch (error: unknown) {
        console.error("Submit signed tx error:", error);

        // Extract Horizon-specific error details if available
        const horizonExtras =
            error && typeof error === "object" && "response" in error
                ? (error as { response?: { data?: { extras?: { result_codes?: unknown } } } })
                    .response?.data?.extras?.result_codes
                : undefined;

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error ? error.message : "Transaction submission failed",
                resultCodes: horizonExtras,
            },
            { status: 400 },
        );
    }
}
