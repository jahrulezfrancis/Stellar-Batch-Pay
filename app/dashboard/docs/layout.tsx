import type { Metadata } from "next";
import { makePageMetadata } from "@/lib/seo";

export const metadata: Metadata = makePageMetadata(
  "Documentation",
  "Read the Stellar BatchPay dashboard guide, file format reference, and support documentation.",
);

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
