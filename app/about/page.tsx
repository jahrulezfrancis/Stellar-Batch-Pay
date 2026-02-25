import TrustedTeamsSection from "@/components/trustedTeams-section";
import { ProfessionalTeamsSection } from "@/components/about/ProfessionalTeamsSection";
import { ValuesSection } from "@/components/about/ValuesSection";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <ProfessionalTeamsSection />
      <ValuesSection />
      <TrustedTeamsSection />
    </main>
  );
}
