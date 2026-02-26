import { Navbar } from "@/components/landing/navbar";
import { ContactForm } from "@/components/contact/ContactForm";
import { SupportCards } from "@/components/contact/SupportCards";
import Link from "next/link";

export const metadata = {
  title: "Contact Us - Stellar BatchPay",
  description: "Get in touch with the Stellar BatchPay team.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0D0F13] text-foreground flex flex-col font-sans">
      {/* <Navbar /> */}

      <div className="flex-1 py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Have questions about integrating with Stellar BatchPay? We're here
              to help you get started with mass cryptocurrency payments.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] gap-8 md:gap-12 items-start">
            <div className="w-full">
              <ContactForm />
            </div>

            <div className="w-full">
              <SupportCards />
            </div>
          </div>
        </div>
      </div>

      <footer className="py-12 border-t border-[#1E2128] mt-auto bg-[#13151A]/50">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-gray-400">
            © 2024 Stellar BatchPay. Open Source.
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="#" className="hover:text-[#00E676] transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-[#00E676] transition-colors">
              Terms
            </Link>
            <Link
              href="https://stellar.org"
              className="hover:text-[#00E676] transition-colors"
            >
              Stellar.org
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
