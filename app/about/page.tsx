import TrustedTeamsSection from "@/components/trustedTeams-section";
import { ProfessionalTeamsSection } from "@/components/about/ProfessionalTeamsSection";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col">

<ProfessionalTeamsSection />
<TrustedTeamsSection />

        </main>
    )
}
