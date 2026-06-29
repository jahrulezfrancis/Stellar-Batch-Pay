import type { Metadata } from "next";
import { makePageMetadata } from "@/lib/seo";

export const metadata: Metadata = makePageMetadata(
  "Vesting",
  "Create and manage Soroban batch vesting schedules for time-locked Stellar payouts.",
);

export default function VestingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
