"use client";

import { useState, useEffect, useCallback } from "react";
import {
    isConnected as freighterIsConnected,
    requestAccess,
    signTransaction,
} from "@stellar/freighter-api";

export interface UseFreighterReturn {
    /** The connected wallet's public key, or null */
    publicKey: string | null;
    /** Whether we are currently connecting */
    isConnecting: boolean;
    /** Whether Freighter extension is installed */
    isInstalled: boolean | null;
    /** Last error message */
    error: string | null;
    /** Connect to Freighter and request access */
    connect: () => Promise<void>;
    /** Clear local state (disconnect) */
    disconnect: () => void;
    /** Sign a transaction XDR via Freighter */
    signTx: (
        xdr: string,
        network: "testnet" | "mainnet",
    ) => Promise<string>;
}

export function useFreighter(): UseFreighterReturn {
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check if Freighter is installed on mount
    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            try {
                const result = await freighterIsConnected();
                if (!cancelled) {
                    setIsInstalled(result.isConnected);
                }
            } catch {
                if (!cancelled) {
                    setIsInstalled(false);
                }
            }
        };

        check();
        return () => {
            cancelled = true;
        };
    }, []);

    const connect = useCallback(async () => {
        setError(null);
        setIsConnecting(true);

        try {
            const accessResult = await requestAccess();
            if (accessResult.error) {
                throw new Error(accessResult.error);
            }
            setPublicKey(accessResult.address);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to connect to Freighter";
            setError(message);
            setPublicKey(null);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setPublicKey(null);
        setError(null);
    }, []);

    const signTx = useCallback(
        async (xdr: string, network: "testnet" | "mainnet"): Promise<string> => {
            if (!publicKey) {
                throw new Error("Wallet not connected");
            }

            const networkPassphrase =
                network === "testnet"
                    ? "Test SDF Network ; September 2015"
                    : "Public Global Stellar Network ; September 2015";

            const result = await signTransaction(xdr, {
                networkPassphrase,
            });

            if (result.error) {
                throw new Error(result.error);
            }

            return result.signedTxXdr;
        },
        [publicKey],
    );

    return {
        publicKey,
        isConnecting,
        isInstalled,
        error,
        connect,
        disconnect,
        signTx,
    };
}
