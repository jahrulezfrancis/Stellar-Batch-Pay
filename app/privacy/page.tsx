import type { Metadata } from "next";
import Link from "next/link";
import StellarFooter from "@/components/landing/StellarFooter";

export const metadata: Metadata = {
  title: "Privacy | Stellar BatchPay",
  description: "Privacy practices for Stellar BatchPay",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-gray-300">
      <main className="mx-auto max-w-3xl px-6 py-24 space-y-8">
        <div>
          <Link href="/" className="text-sm text-[#00D98B] hover:underline">
            Home
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-white">Privacy</h1>
        </div>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold text-white">Analytics</h2>
          <p>
            Usage analytics are disabled by default in self-hosted deployments.
            They load only when{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">
              NEXT_PUBLIC_ENABLE_ANALYTICS=true
            </code>{" "}
            and you opt in by setting{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">
              localStorage.analytics_consent
            </code>{" "}
            to <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">true</code>{" "}
            in your browser. Vercel-hosted previews may enable analytics separately
            through project environment variables.
          </p>
          <p>
            Batch payment data is read from the Stellar network for connected wallets.
            Server-side job history is stored in SQLite paths configured with{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">
              JOB_STORE_PATH
            </code>
            ; see DEPLOYMENT.md for hosting requirements.
          </p>
        </section>
      </main>
      <StellarFooter />
    </div>
  );
}
