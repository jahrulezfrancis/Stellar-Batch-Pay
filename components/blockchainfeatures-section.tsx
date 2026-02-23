"use client";

import { Upload, ShieldCheck, Zap, PieChart } from "lucide-react";
import { Bulk,Validation,Stellar,Report} from "./blockchainIcons"
const features = [
  {
    icon: Bulk,
    title: "Bulk Payment Automation",
    description:
      "Upload CSV or JSON files and send multiple payments simultaneously with a single click.",
  },
  {
    icon: Validation,
    title: "Automatic Validation",
    description:
      "Prevent costly mistakes with built-in address and amount verification before submission.",
  },
  {
    icon: Stellar,
    title: "Stellar Network Integration",
    description:
      "Lightning-fast transactions with minimal fees on one of the most efficient blockchains.",
  },
  {
    icon: Report,
    title: "Transparent Reporting",
    description:
      "Detailed status reports, transaction IDs, and comprehensive payment summaries.",
  },
];

export default function BlockchainFeaturesSection() {
  return (
    <section
      style={{ backgroundColor: "#0A0E1A", width: "100%",border:"1px solid #E5E7EB " }}
      className="py-16 px-4 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
        <h2
          style={{ color: "#ffffff" }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 sm:mb-6"
        >
          Built for{" "}
          <span style={{ color: "#00D98B" }}>
            Efficient Blockchain
            <br className="hidden sm:block" /> Payments.
          </span>
        </h2>
        <p
          style={{ color: "#8B92B0" }}
          className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto"
        >
          Everything you need to automate and scale your crypto payment
          operations.
        </p>
      </div>

      {/* Cards Grid — 1 col → 2 col → 4 col */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            style={{
              backgroundColor: "#1A1F2E80",
              border: "1px solid #252B3D",
              borderRadius: "16px",
            }}
            className="p-6 sm:p-7 flex flex-col gap-8"
          >
            {/* Icon Box */}
            <div
              style={{
                backgroundColor: "#00D98B1A",
                borderRadius: "12px",
                width: "52px",
                height: "52px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon/>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-3">
              <h3
                style={{ color: "#ffffff" }}
                className="font-bold text-base sm:text-lg leading-snug"
              >
                {title}
              </h3>
              <p
                style={{ color: "#8B92B0" }}
                className="text-sm leading-relaxed"
              >
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}