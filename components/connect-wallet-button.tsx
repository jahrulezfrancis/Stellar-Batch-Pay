"use client";

import { useFreighter } from "@/hooks/use-freighter";
import { Button } from "@/components/ui/button";

/**
 * "Connect Wallet" button that integrates with Freighter.
 *
 * Shows:
 *  - "Connect Freighter" when disconnected
 *  - Truncated public key + Disconnect when connected
 *  - Loading spinner when connecting
 *  - Install prompt when Freighter is not detected
 */
export function ConnectWalletButton() {
    const { publicKey, isConnecting, isInstalled, error, connect, disconnect } =
        useFreighter();

    // ── Freighter not installed ──────────────────────────────────
    if (isInstalled === false) {
        return (
            <div className="flex flex-col items-start gap-2">
                <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Button variant="outline" className="gap-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                        <WalletIcon className="h-4 w-4" />
                        Install Freighter
                    </Button>
                </a>
                <p className="text-xs text-muted-foreground">
                    Freighter browser extension is required to sign transactions.
                </p>
            </div>
        );
    }

    // ── Connected ────────────────────────────────────────────────
    if (publicKey) {
        const truncated = `${publicKey.slice(0, 4)}…${publicKey.slice(-4)}`;
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-mono text-emerald-300">{truncated}</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={disconnect}
                    className="text-muted-foreground hover:text-destructive"
                >
                    Disconnect
                </Button>
            </div>
        );
    }

    // ── Disconnected / Connecting ────────────────────────────────
    return (
        <div className="flex flex-col items-start gap-2">
            <Button
                onClick={connect}
                disabled={isConnecting || isInstalled === null}
                className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
            >
                {isConnecting ? (
                    <>
                        <LoaderIcon className="h-4 w-4 animate-spin" />
                        Connecting…
                    </>
                ) : (
                    <>
                        <WalletIcon className="h-4 w-4" />
                        Connect Freighter
                    </>
                )}
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

/* ── Inline SVG icons ────────────────────────────────────────── */

function WalletIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </svg>
    );
}

function LoaderIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}
