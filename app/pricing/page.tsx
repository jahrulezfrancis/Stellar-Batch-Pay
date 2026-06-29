import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import StellarFooter from "@/components/landing/StellarFooter";
import { PayPerTransaction } from "@/components/pricing/pay-per-transaction";
import { PricingPlans } from "@/components/pricing/pricing-plans";
import { CompareFeatures } from "@/components/pricing/compare-features";
import { CostExampleSection } from "@/components/pricing/CostExampleSection";
import { FaqSection } from "@/components/pricing/faq-section";
import { CtaSection } from "@/components/cta/cta-section";
import { makePageMetadata } from "@/lib/seo";

export const metadata: Metadata = makePageMetadata(
  "Pricing",
  "Simple, transparent pricing for Stellar BatchPay. Pay only for what you use with no hidden fees.",
);

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0A0E1A] w-full text-white flex flex-col font-sans tracking-tight">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 w-full max-w-[1440px] mx-auto min-h-[428px] mt-[65px] flex flex-col items-center text-center px-6 sm:px-8 md:px-12 pt-16">
        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-[56px] lg:text-[64px] font-bold leading-tight mb-8 text-[#FFFFFF]">
          Simple, Transparent <span className="text-[#00D084]">Pricing</span>
        </h1>

        {/* Primary Supporting Text */}
        <p className="text-[#E0E2E8] text-lg sm:text-xl md:text-[22px] max-w-4xl mb-6 font-medium leading-relaxed">
          Pay only for what you use. No hidden fees. Fully optimized for batch
          crypto payments on Stellar.
        </p>

        {/* Secondary Supporting Text */}
        <p className="text-[#9BA1B0] text-sm sm:text-base md:text-[18px] max-w-3xl font-normal leading-normal">
          Scale your payments efficiently with low transaction costs and
          automated workflows.
        </p>
      </section>

      {/* CTA Section */}
      <section>
        <CtaSection
          title="Ready to Start Sending?"
          description="Join thousands of businesses using Stellar BatchPay for efficient crypto payments."
          primaryButtonText="Start Sending Payments"
          secondaryButtonText="View Documentation"
        />
      </section>

      {/* Pay Per Transaction Section */}
      <PayPerTransaction />

      {/* Pricing Plans Section */}
      <PricingPlans />

      {/* Compare Features Section */}
      <CompareFeatures />
      {/* Cost Example Section */}
      <CostExampleSection />
      {/* FAQ Section */}
      <FaqSection />

      <StellarFooter />
    </main>
  );
}
