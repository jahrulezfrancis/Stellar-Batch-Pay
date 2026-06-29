"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardWalletEmpty } from "@/components/dashboard/dashboard-wallet-empty";
import { useWallet } from "@/contexts/WalletContext";

// Settings is intentionally public: it hosts the wallet connect UI, so blocking
// it without a wallet creates a catch-22 where users can't find the connect flow.
// Wallet-specific actions inside the page remain gated by publicKey checks there.
const PUBLIC_DASHBOARD_PATHS = new Set(["/dashboard/docs", "/dashboard/settings"]);

export function WalletGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { publicKey } = useWallet();

  if (!publicKey && !PUBLIC_DASHBOARD_PATHS.has(pathname)) {
    return <DashboardWalletEmpty />;
  }

  return <>{children}</>;
}
