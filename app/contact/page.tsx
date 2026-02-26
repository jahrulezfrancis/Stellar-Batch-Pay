import { Navbar } from "@/components/landing/navbar";
import { ContactForm } from "@/components/contact/ContactForm";
import { SupportCards } from "@/components/contact/SupportCards";

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
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] gap-8 md:gap-12 items-stretch">
            <div className="w-full h-full">
              <ContactForm />
            </div>

            <div className="w-full h-full">
              <SupportCards />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
