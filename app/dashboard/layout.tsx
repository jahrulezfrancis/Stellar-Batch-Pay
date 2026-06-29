import type { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard-layout";
import { makePageMetadata } from "@/lib/seo";

export const metadata: Metadata = makePageMetadata(
  "Dashboard Overview",
  "Monitor batch payments, analytics, history, address books, and vesting tools from the Stellar BatchPay dashboard.",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
