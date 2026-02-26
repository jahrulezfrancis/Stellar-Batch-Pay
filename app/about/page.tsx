import { AboutHero } from "@/components/landing/AboutHero";
import { ProductOverview } from "@/components/landing/product-overview";
import TrustedTeamsSection from "@/components/trustedTeams-section";
import { Navbar } from "@/components/landing/navbar";
import Link from "next/link";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col">
            {/* <Navbar /> */}
            <AboutHero />
            <ProductOverview />
            <TrustedTeamsSection />
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
    )
}
