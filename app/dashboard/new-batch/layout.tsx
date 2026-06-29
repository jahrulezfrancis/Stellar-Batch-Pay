import type { Metadata } from "next";
import { makePageMetadata } from "@/lib/seo";

export const metadata: Metadata = makePageMetadata(
  "New Batch",
  "Create and validate a new Stellar batch payment from uploaded files or manual recipient entry.",
);

export default function NewBatchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
