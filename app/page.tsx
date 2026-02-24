import { Hero } from "@/components/landing/Hero";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
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

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <Hero />
      <ProcessSection />
      <HowItWorks />
      <FeatureSection />
      <BlockchainFeaturesSection />
      <SecuritySection />
      <PaymentWorkflowsSection />
      <CryptoPaymentSection />
      <CtaSection />

      <footer className="py-12 border-t mt-auto bg-secondary/10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-muted-foreground">
            © 2024 Stellar BatchPay. Open Source.
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="https://stellar.org" className="hover:text-foreground">
              Stellar.org
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
