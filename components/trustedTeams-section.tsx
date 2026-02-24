"use client";

import { CreditCard, Trophy, Handshake, Building2, Users, Coins, Check } from "lucide-react";

const useCases = [
  {
    icon: CreditCard,
    iconBg: {
      background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 70.71%)"
    },
    iconColor: "#7eb3f5",
    title: "Payroll Payments",
    description:
      "Distribute salaries to remote teams globally with instant settlement and minimal fees.",
    bullets: ["Automated monthly payouts", "Multi-currency support"],
  },
  {
    icon: Trophy,
    iconBg: {
      background: "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.2) 70.71%)"
    },
    iconColor: "#c084fc",
    title: "Contributor Rewards",
    description:
      "Incentivize open-source contributors, bug bounty hunters, and community developers.",
    bullets: ["Milestone-based payments", "Transparent tracking"],
  },
  {
    icon: Handshake,
    iconBg: {
      background: "linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.2) 70.71%)"
    },
    iconColor: "#fb923c",
    title: "Affiliate Payouts",
    description:
      "Manage commission payments to partners and affiliates with complete accuracy.",
    bullets: ["Performance-based rewards", "Automated calculations"],
  },
  {
    icon: Building2,
    iconBg: {
      background: "linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.2) 70.71%)"
    },
    iconColor: "#34d399",
    title: "Vendor Settlements",
    description:
      "Pay suppliers, contractors, and service providers efficiently across borders.",
    bullets: ["Invoice reconciliation", "Scheduled payments"],
  },
  {
    icon: Users,
    iconBg: {
      background: "linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(219, 39, 119, 0.2) 70.71%)"
    },
    iconColor: "#f472b6",
    title: "Community Incentives",
    description:
      "Distribute tokens, airdrops, and rewards to community members at scale.",
    bullets: ["Bulk token distribution", "Engagement campaigns"],
  },
  {
    icon: Coins,
    iconBg: {
      background: "linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(202, 138, 4, 0.2) 70.71%)"
    },
    iconColor: "#EAB308",
    title: "Staking Rewards",
    description:
      "Automate reward distribution for staking pools and validator operations.",
    bullets: ["Proportional distribution", "Recurring schedules"],
  },
];

export default function TrustedTeamsSection() {
  return (
    <section
      style={{ backgroundColor: "#0a0f14", width: "100%" }}
      className="py-16 px-4 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
        {/* Badge */}
        <div className="flex justify-center mb-5">
          <span
            style={{
              backgroundColor: "#0d2e1f",
              border: "1px solid #22c55e",
              color: "#22c55e",
              borderRadius: "9999px",
              padding: "6px 18px",
              fontSize: "0.85rem",
              fontWeight: 500,
              letterSpacing: "0.01em",
              display: "inline-block",
            }}
          >
            Use Cases
          </span>
        </div>

        {/* Heading */}
        <h2
          style={{ color: "#ffffff" }}
          className="text-3xl sm:text-4xl lg:text-4xl font-bold leading-tight mb-5"
        >
          Trusted by Forward-Thinking Teams
        </h2>

        {/* Subtext */}
        <p
          style={{ color: "#8b949e" }}
          className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto"
        >
          From startups to enterprises, teams across industries rely on Stellar
          BatchPay for their payment operations.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {useCases.map(({ icon: Icon, iconBg, iconColor, title, description, bullets }) => (
          <div
            key={title}
            style={{
              backgroundColor: "#141b24",
              border: "1px solid #252B3D",
              borderRadius: "16px",
            }}
            className="p-6 sm:p-7 flex flex-col gap-5"
          >
            {/* Icon Box - Fixed with spread operator */}
            <div
              style={{
                ...iconBg,
                borderRadius: "12px",
                width: "52px",
                height: "52px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={22} style={{ color: iconColor }} />
            </div>

            {/* Title */}
            <h3
              style={{ color: "#ffffff" }}
              className="font-bold text-base sm:text-lg leading-snug"
            >
              {title}
            </h3>

            {/* Description */}
            <p
              style={{ color: "#8b949e" }}
              className="text-sm leading-relaxed"
            >
              {description}
            </p>

            {/* Bullet Points */}
            <ul className="flex flex-col gap-2 mt-auto">
              {bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-center gap-2"
                >
                  <Check
                    size={14}
                    style={{ color: "#22c55e", flexShrink: 0 }}
                    strokeWidth={3}
                  />
                  <span style={{ color: "#8b949e" }} className="text-sm">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}