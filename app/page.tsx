import { Hero } from "@/components/landing/Hero";
import { FeatureSection } from "@/components/feature-section";
import { HowItWorks } from "@/components/how-it-works";
import { CtaSection } from "@/components/cta-section";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BlockchainFeaturesSection from "@/components/blockchainfeatures-section";
import CryptoPaymentSection from "@/components/cryptopay-section";
import { Navbar } from "@/components/landing/navbar";
import { ProcessSection } from "@/components/landing/process-section";
import { SecuritySection } from "@/components/landing/security-section";
import { PaymentWorkflowsSection } from "@/components/payment-workflows-section";
import { MissionSection } from "@/components/landing/mission-section";
import { WhyTeamsChooseBatchPay } from "@/components/landing/WhyTeamsChooseBatchPay";
import StellarFooter from "@/components/landing/StellarFooter";
import { makePageMetadata } from "@/lib/seo";

export const metadata = makePageMetadata(
  "Batch Payments",
  "Send multiple payments on the Stellar blockchain in seconds. Explore batch payments, Soroban vesting, and secure wallet-driven workflows.",
);

export default function LandingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <Hero />
      <ProcessSection />
      <WhyTeamsChooseBatchPay />
      <HowItWorks />
      <FeatureSection />
      <BlockchainFeaturesSection />
      <SecuritySection />
      <PaymentWorkflowsSection />
      <MissionSection />
      <CryptoPaymentSection />
      <CtaSection />
      <StellarFooter />
    </main>
  );
}
