import type { Metadata } from "next";
import { makePageMetadata } from "@/lib/seo";

export const metadata: Metadata = makePageMetadata(
  "Address Book",
  "Manage saved Stellar recipient addresses and aliases for faster batch payment workflows.",
);

export default function AddressBookLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
