import type { Metadata } from "next";
import { makePageMetadata } from "@/lib/seo";

export const metadata: Metadata = makePageMetadata(
  "Batch History Details",
  "Inspect the details, status, and results for an individual batch payment job.",
);

export default function JobHistoryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
