import type { Metadata } from "next";
import { makePageMetadata } from "@/lib/seo";

export const metadata: Metadata = makePageMetadata(
  "Analytics",
  "Review on-chain batch payment volume and success metrics for the connected Stellar wallet.",
);

export default function AnalyticsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
