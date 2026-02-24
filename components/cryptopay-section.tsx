"use client";

import { Clock, AlertTriangle, TrendingUp } from "lucide-react";

const challenges = [
  {
    icon: Clock,
    iconBg: "#EF44441A",
    iconColor: "#EF4444",
    title: "Time-Consuming Manual Transfers",
    description:
      "Sending payments one by one wastes valuable time and resources that could be better spent on growth.",
  },
  {
    icon: AlertTriangle,
    iconBg: "#EAB3081A",
    iconColor: "#EAB308",
    title: "Error-Prone Processes",
    description:
      "Manual entry increases the risk of costly mistakes in addresses and amounts that can't be reversed.",
  },
  {
    icon: TrendingUp,
    iconBg: "#F973161A",
    iconColor: "#F97316",
    title: "Difficult to Track at Scale",
    description:
      "Managing hundreds of individual transactions makes monitoring status and maintaining records nearly impossible.",
  },
];

export default function CryptoPaymentSection() {
  return (
    <section
      style={{ backgroundColor: "#121827", width: "100%", }}
      className="py-16 px-4 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
        <h2
          style={{ color: "#FFFFFF" }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 sm:mb-6"
        >
          Managing Crypto Payouts{" "}
          <span style={{ color: "#00D98B" }} className="block">
            Shouldn&apos;t Be Complicated.
          </span>
        </h2>
        <p
          style={{ color: "#8B92B0" }}
          className="text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto"
        >
          Traditional methods of handling bulk cryptocurrency payments create
          unnecessary friction and risk.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {challenges.map(({ icon: Icon, iconBg, iconColor, title, description }) => (
          <div
            key={title}
            style={{
              backgroundColor: "#1A1F2E80",
              border: "1px solid #252B3D",
              borderRadius: "16px",
            }}
            className="p-6 sm:p-8 flex flex-col gap-6"
          >
            {/* Icon Box */}
            <div
              style={{
                backgroundColor: iconBg,
                borderRadius: "12px",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={22} style={{ color: iconColor }} />
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
                className="text-sm sm:text-base leading-relaxed"
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