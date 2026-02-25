import { CreateAccountNavbar } from "@/components/create-account/CreateAccountNavbar";
import MarketingSection from "@/components/create-account/MarketingSection";
import RegistrationForm from "@/components/create-account/RegistrationForm";

export default function RegisterPage() {
  return (
    <>
      <CreateAccountNavbar />
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden" style={{background: 'linear-gradient(180deg, #030712 0%, #111827 50%, #030712 100%)'}}>
        {/* Subtle background glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#00d4a0]/5 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 w-80 h-80 rounded-full bg-[#00d4a0]/4 blur-3xl" />
        </div>

        <div className="relative w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-6 items-start">
            {/* Left: Marketing */}
            <div className="lg:sticky lg:top-24 pt-4 lg:pt-0">
              <MarketingSection />
            </div>

            {/* Right: Form Card */}
            <div className="bg-[#0f1929] border border-gray-800/60 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
              <RegistrationForm />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}