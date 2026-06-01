"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "./use-toast";

type LedgerTransport = {
  close: () => Promise<void> | void;
};

export interface LedgerState {
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  error: string | null;
  deviceInfo: string | null;
}

export function useLedger() {
  const { toast } = useToast();
  const transportRef = useRef<LedgerTransport | null>(null);
  const signQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [state, setState] = useState<LedgerState>({
    isConnected: false,
    isConnecting: false,
    publicKey: null,
    error: null,
    deviceInfo: null,
  });

  const closeTransport = useCallback(async () => {
    const transport = transportRef.current;
    transportRef.current = null;

    if (transport) {
      await transport.close();
    }
  }, []);

  const getTransport = useCallback(async () => {
    if (transportRef.current) {
      return transportRef.current;
    }

    const { default: TransportWebUSB } = await import("@ledgerhq/hw-transport-webusb");
    const transport = await TransportWebUSB.create();
    transportRef.current = transport;
    return transport;
  }, []);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const { default: TransportWebUSB } = await import("@ledgerhq/hw-transport-webusb");
      const { default: StellarApp } = await import("@ledgerhq/hw-app-str");

      const transport = await TransportWebUSB.create();
      transportRef.current = transport;
      const stellar = new StellarApp(transport) as any;

      // Get app info to verify Stellar app is open
      const appInfo = await stellar.getAppInfo();
      if (!appInfo.appName.includes("Stellar")) {
        throw new Error("Please open the Stellar app on your Ledger device");
      }

      // Get public key from Ledger (first account, path 0)
      const result = await stellar.getPublicKey("44'/148'/0'");

      setState({
        isConnected: true,
        isConnecting: false,
        publicKey: result.publicKey,
        error: null,
        deviceInfo: `Ledger - ${appInfo.appName} v${appInfo.version}`,
      });

      toast({
        title: "Ledger Connected",
        description: `Connected to ${result.publicKey.slice(0, 8)}...${result.publicKey.slice(-4)}`,
      });

      return result.publicKey;
    } catch (error) {
      await closeTransport().catch((closeError) => {
        console.warn("Failed to close Ledger transport after connection error:", closeError);
      });

      let errorMessage = "Failed to connect to Ledger";

      if (error instanceof Error) {
        if (error.message.includes("No device selected")) {
          errorMessage = "No Ledger device found. Please connect your Ledger via USB.";
        } else if (error.message.includes("The device is locked")) {
          errorMessage = "Your Ledger device is locked. Please unlock it and try again.";
        } else if (error.message.includes("Stellar app")) {
          errorMessage = "Please open the Stellar app on your Ledger device.";
        } else if (error.message.includes("WebUSB")) {
          errorMessage = "WebUSB not supported. Please use Chrome, Edge, or Opera.";
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: errorMessage,
      }));

      toast({
        title: "Ledger Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, [closeTransport, getTransport, toast]);

  const runQueuedSign = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = signQueueRef.current.then(task, task);
    signQueueRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    if (!state.isConnected) {
      throw new Error("Ledger not connected");
    }

    return runQueuedSign(async () => {
      try {
        const { default: TransportWebUSB } = await import("@ledgerhq/hw-transport-webusb");
        const { default: StellarApp } = await import("@ledgerhq/hw-app-str");

        const transport = await TransportWebUSB.create();
        const stellar = new StellarApp(transport) as any;

        // Sign the transaction using Ledger. Chrome, Edge, and Opera are the
        // supported WebUSB browsers for Ledger signing.
        const result = await stellar.signTransaction("44'/148'/0'", xdr);

        await closeTransport();

        return result.signedTxXdr;
      } catch (error) {
        await closeTransport().catch((closeError) => {
          console.warn("Failed to close Ledger transport after signing error:", closeError);
        });

        let errorMessage = "Failed to sign transaction with Ledger";

        if (error instanceof Error) {
          if (error.message.includes("Transaction approval request")) {
            errorMessage = "Transaction was rejected on Ledger device";
          } else if (error.message.includes("locked")) {
            errorMessage = "Device locked. Please unlock your Ledger and try again.";
          } else {
            errorMessage = error.message;
          }
        }

        toast({
          title: "Ledger Signing Failed",
          description: errorMessage,
          variant: "destructive",
        });

        throw new Error(errorMessage);
      }
    });
  }, [closeTransport, getTransport, runQueuedSign, state.isConnected, toast]);

  const disconnect = useCallback(async () => {
    await closeTransport().catch((error) => {
      console.warn("Failed to close Ledger transport on disconnect:", error);
    });

    setState({
      isConnected: false,
      isConnecting: false,
      publicKey: null,
      error: null,
      deviceInfo: null,
    });
  }, [closeTransport]);

  useEffect(() => {
    return () => {
      void closeTransport().catch((error) => {
        console.warn("Failed to close Ledger transport on unmount:", error);
      });
    };
  }, [closeTransport]);

  // Check if WebUSB is available. Ledger WebUSB signing is supported in Chromium browsers.
  const isWebUSBSupported = typeof navigator !== "undefined" && "usb" in navigator;

  return {
    ...state,
    connect,
    disconnect,
    signTransaction,
    isWebUSBSupported,
  };
}
