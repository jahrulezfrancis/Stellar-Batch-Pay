'use client';

import Image from "next/image";
import { Globe, Lock } from "lucide-react";
import securityoption from "@/public/securityoption.png";

const features = [
  {
    type: "image" as const,
    text: "Bank-grade security & encryption",
  },
  {
    type: "globe" as const,
    text: "Transparent blockchain transactions",
  },
  {
    type: "lock" as const,
    text: "Your data privacy protected",
  },
];

function FeatureIcon({ type }: { type: "image" | "globe" | "lock" }) {
  return (
    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#22C55E33] flex items-center justify-center">
      {type === "image" && (
        <Image
          src={securityoption}
          alt="Security"
          width={20}
          height={20}
          className="brightness-0 invert"
        />
      )}
      {type === "globe" && (
        <Globe size={18} className="text-white" strokeWidth={2.5} />
      )}
      {type === "lock" && (
        <Lock size={18} className="text-white" strokeWidth={2.5} />
      )}
    </span>
  );
}

export default function MarketingSection() {
  return (
    <div className="flex flex-col justify-center lg:pr-12 xl:pr-16">
      <div className="mb-8">
        <h1
          className="font-bold text-white leading-tight mb-4"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          {/* whitespace-nowrap keeps "Create Your BatchPay" on a single line */}
          <span className="whitespace-nowrap">
            Create Your <span className="text-[#00D98B]">BatchPay</span>
          </span>
          <br />
          Account
        </h1>

        <p className="text-base text-gray-300 leading-relaxed mb-2">
          Start sending bulk cryptocurrency payments securely on the Stellar
          blockchain.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          Automate payouts, reduce errors, and streamline blockchain payment
          workflows.
        </p>
      </div>

      <ul className="flex flex-col gap-5">
        {features.map(({ type, text }) => (
          <li key={text} className="flex items-center gap-4">
            <FeatureIcon type={type} />
            <span className="text-sm text-gray-300">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}