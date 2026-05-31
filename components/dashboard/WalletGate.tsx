"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardWalletEmpty } from "@/components/dashboard/dashboard-wallet-empty";
import { useWallet } from "@/contexts/WalletContext";

const PUBLIC_DASHBOARD_PATHS = new Set(["/dashboard/docs"]);

export function WalletGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { publicKey } = useWallet();

  if (!publicKey && !PUBLIC_DASHBOARD_PATHS.has(pathname)) {
    return <DashboardWalletEmpty />;
  }

  return <>{children}</>;
}
