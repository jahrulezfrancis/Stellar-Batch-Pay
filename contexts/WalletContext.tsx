"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useStellarWallet, SigningMethod } from "@/hooks/use-stellar-wallet";
import { useFreighter } from "@/hooks/use-freighter";
import { Sep7Modal } from "@/components/dashboard/Sep7Modal";
import { Networks } from "stellar-sdk";
import { isMobileDevice } from "@/lib/stellar/sep7";

export type SorobanNetwork = "mainnet" | "testnet" | "futurenet";

interface WalletContextType {
  publicKey: string | null;
  isConnecting: boolean;
  isInstalled: boolean | null;
  error: string | null;
  network: SorobanNetwork | null;
  networkMismatch: boolean;
  expectedNetwork: SorobanNetwork;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTx: (xdr: string, network: SorobanNetwork) => Promise<string>;
  selectNetwork: (network: SorobanNetwork) => void;
  method: SigningMethod | null;
  sep7Uri: string | null;
  isSep7ModalOpen: boolean;
  setSep7ModalOpen: (open: boolean) => void;
  ledger: ReturnType<typeof import("@/hooks/use-ledger").useLedger>;
  connectLedger: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export interface WalletProviderProps {
  children: React.ReactNode;
  expectedNetwork?: SorobanNetwork;
}

export function WalletProvider({ children, expectedNetwork = "testnet" }: WalletProviderProps) {
  const wallet = useStellarWallet();
  const freighter = useFreighter();
  const [selectedNetwork, setSelectedNetwork] = useState<SorobanNetwork>(expectedNetwork);
  const [detectedNetwork, setDetectedNetwork] = useState<SorobanNetwork | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  const normalizeDetectedNetwork = useCallback((networkPassphrase: string | null): SorobanNetwork | null => {
    if (!networkPassphrase) {
      return wallet.method === "ledger" ? selectedNetwork : null;
    }

    if (networkPassphrase === Networks.TESTNET) return "testnet";
    if (networkPassphrase === Networks.PUBLIC) return "mainnet";
    if (networkPassphrase.toLowerCase().includes("future")) return "futurenet";

    return null;
  }, [selectedNetwork, wallet.method]);

  // Restore network from localStorage on mount
  useEffect(() => {
    const storedNetwork = (localStorage.getItem("wallet_network") as SorobanNetwork) || expectedNetwork;
    setSelectedNetwork(storedNetwork);
  }, [expectedNetwork]);

  // Detect network 
  useEffect(() => {
    if (wallet.publicKey) {
      const liveNetwork = normalizeDetectedNetwork(wallet.networkPassphrase);
      setDetectedNetwork(liveNetwork);
      setNetworkMismatch(liveNetwork !== selectedNetwork);
      localStorage.setItem("wallet_public_key", wallet.publicKey);
    } else {
      setDetectedNetwork(null);
      setNetworkMismatch(false);
      localStorage.removeItem("wallet_public_key");
    }
  }, [wallet.publicKey, wallet.networkPassphrase, selectedNetwork, expectedNetwork, normalizeDetectedNetwork]);

  const handleConnect = useCallback(async () => {
    try {
      await wallet.connect();
      localStorage.setItem("wallet_network", selectedNetwork);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  }, [wallet, selectedNetwork]);

  const handleConnectLedger = useCallback(async () => {
    try {
      setLedgerError(null);
      await wallet.connectLedger();
      localStorage.setItem("wallet_network", selectedNetwork);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect Ledger";
      setLedgerError(errorMsg);
      console.error("Failed to connect Ledger:", err);
    }
  }, [wallet, selectedNetwork]);

  const handleDisconnect = useCallback(() => {
    wallet.disconnect();
    localStorage.removeItem("wallet_public_key");
    localStorage.removeItem("wallet_network");
    setLedgerError(null);
  }, [wallet]);

  const handleSelectNetwork = useCallback((network: SorobanNetwork) => {
    setSelectedNetwork(network);
    localStorage.setItem("wallet_network", network);
  }, []);

  const handleSignTx = useCallback(
    async (xdr: string, network: SorobanNetwork): Promise<string> => {
      return wallet.signTx(xdr, network === "mainnet" ? "mainnet" : "testnet");
    },
    [wallet]
  );

  // On mobile, SEP-7 deep-linking is always viable so treat as installed.
  // On desktop, reflect real Freighter extension detection from useFreighter.
  const isInstalled = isMobileDevice() ? true : freighter.isInstalled;

  const value: WalletContextType = {
    publicKey: wallet.publicKey,
    isConnecting: wallet.isConnecting,
    isInstalled,
    error: ledgerError,
    network: detectedNetwork,
    networkMismatch,
    expectedNetwork: selectedNetwork,
    connect: handleConnect,
    disconnect: handleDisconnect,
    signTx: handleSignTx,
    selectNetwork: handleSelectNetwork,
    method: wallet.method,
    sep7Uri: wallet.sep7Uri,
    isSep7ModalOpen: wallet.isSep7ModalOpen,
    setSep7ModalOpen: wallet.setSep7ModalOpen,
    ledger: wallet.ledger,
    connectLedger: handleConnectLedger,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
      <Sep7Modal
        isOpen={wallet.isSep7ModalOpen}
        onOpenChange={wallet.setSep7ModalOpen}
        uri={wallet.sep7Uri}
      />
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
