/**
 * API route for building unsigned batch payment transactions.
 *
 * POST /api/batch-build
 *
 * Accepts { payments, network, publicKey } and returns an array of
 * unsigned transaction XDRs ready for client-side signing (e.g. Freighter).
 */

import { NextRequest, NextResponse } from "next/server";
import {
    TransactionBuilder,
    BASE_FEE,
    Networks,
    Asset as StellarAsset,
    Operation,
    Horizon,
    Memo,
} from "stellar-sdk";
import { validatePaymentInstructions } from "@/lib/stellar";
import { createBatches, parseAsset } from "@/lib/stellar/batcher";
import { validatePaymentInstruction } from "@/lib/stellar/validator";
import type { PaymentInstruction } from "@/lib/stellar/types";

interface RequestBody {
    payments: PaymentInstruction[];
    network: "testnet" | "mainnet";
    publicKey: string;
}

const MAX_OPS = 100;

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as RequestBody;
        const { payments, network, publicKey } = body;

        // ── Validate inputs ──────────────────────────────────────────

        if (!publicKey || typeof publicKey !== "string") {
            return NextResponse.json(
                { error: "publicKey is required" },
                { status: 400 },
            );
        }

        if (!/^G[A-Z2-7]{54,56}$/.test(publicKey)) {
            return NextResponse.json(
                { error: "Invalid Stellar public key format" },
                { status: 400 },
            );
        }

        if (!Array.isArray(payments) || payments.length === 0) {
            return NextResponse.json(
                { error: "payments must be a non-empty array" },
                { status: 400 },
            );
        }

        if (!["testnet", "mainnet"].includes(network)) {
            return NextResponse.json(
                { error: "network must be 'testnet' or 'mainnet'" },
                { status: 400 },
            );
        }

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

        // ── Build unsigned XDRs ──────────────────────────────────────

        const serverUrl =
            network === "testnet"
                ? "https://horizon-testnet.stellar.org"
                : "https://horizon.stellar.org";
        const server = new Horizon.Server(serverUrl);

        const sourceAccount = await server.loadAccount(publicKey);
        const batches = createBatches(payments, MAX_OPS);
        const networkPassphrase =
            network === "testnet" ? Networks.TESTNET : Networks.PUBLIC;

        const xdrs: string[] = [];

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const memoId = `bp-${Date.now()}-${i}`;

            let builder = new TransactionBuilder(sourceAccount, {
                fee: BASE_FEE,
                networkPassphrase,
            }).addMemo(Memo.text(memoId.slice(0, 28)));

            for (const payment of batch.payments) {
                const pv = validatePaymentInstruction(payment);
                if (!pv.valid) continue;

                const asset = parseAsset(payment.asset);
                const stellarAsset =
                    asset.issuer === null
                        ? StellarAsset.native()
                        : new StellarAsset(asset.code, asset.issuer);

                builder = builder.addOperation(
                    Operation.payment({
                        destination: payment.address,
                        asset: stellarAsset,
                        amount: payment.amount,
                    }),
                );
            }

            const transaction = builder.setTimeout(300).build();
            xdrs.push(transaction.toXDR());

            // Increment the sequence number for the next transaction
            sourceAccount.incrementSequenceNumber();
        }

        return NextResponse.json({
            xdrs,
            batchCount: batches.length,
            network,
            publicKey,
        });
    } catch (error) {
        console.error("Batch build error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Internal server error",
            },
            { status: 500 },
        );
    }
}
