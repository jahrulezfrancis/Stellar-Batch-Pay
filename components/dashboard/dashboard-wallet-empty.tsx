"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { ConnectWalletButton } from "@/components/connect-wallet-button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export const DASHBOARD_WALLET_EMPTY_TITLE =
  "Connect your wallet to view data";

export const DASHBOARD_WALLET_EMPTY_DESCRIPTION =
  "Link a Stellar wallet to load batch history, metrics, and vesting schedules for your account.";

export function DashboardWalletEmpty({ className }: { className?: string }) {
  return (
    <Empty
      className={cn(
        "rounded-xl border border-dashed border-[#1F2937] bg-[#121827]",
        className,
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Wallet className="size-6" aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="text-white">{DASHBOARD_WALLET_EMPTY_TITLE}</EmptyTitle>
        <EmptyDescription>{DASHBOARD_WALLET_EMPTY_DESCRIPTION}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <ConnectWalletButton />
        <p className="mt-3 text-sm text-slate-400">
          Or go to{" "}
          <Link
            href="/dashboard/settings"
            className="text-emerald-400 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
          >
            Settings
          </Link>{" "}
          to manage your wallet connection.
        </p>
      </EmptyContent>
    </Empty>
  );
}
