import { QuickStartGuide } from "@/components/dashboard/docs/QuickStartGuide";
import { SupportHelp } from "@/components/dashboard/docs/SupportHelp";
import FAQSection from "@/components/dashboard/docs/FAQSection";
import { FileFormatDocumentation } from "@/components/dashboard/FileFormatDocumentation";

export default function DashboardDocsPage() {
  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      <QuickStartGuide />
      <FileFormatDocumentation />
      <FAQSection />
      <SupportHelp />
    </div>
  );
}
