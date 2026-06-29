import type { Metadata } from "next";
import { makePageMetadata } from "@/lib/seo";

export const metadata: Metadata = makePageMetadata(
  "Sign In",
  "Connect your Stellar wallet to access batch history, dashboard analytics, and secure payment workflows.",
);

export default function SignInLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
