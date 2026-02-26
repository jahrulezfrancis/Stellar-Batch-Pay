import { Headphones, Shield, Handshake } from "lucide-react";

export function SupportCards() {
  const cards = [
    {
      icon: <Headphones className="w-5 h-5 text-[#00E676]" />,
      title: "Technical Support",
      description:
        "Get help with integration, API issues, and platform functionality.",
      email: "support@batchpay.com",
      note: "Response within 24 hours",
    },
    {
      icon: <Shield className="w-5 h-5 text-[#00E676]" />,
      title: "Security & Compliance",
      description: "Report vulnerabilities and security concerns responsibly.",
      email: "security@batchpay.com",
      note: "Encrypted communications preferred",
    },
    {
      icon: <Handshake className="w-5 h-5 text-[#00E676]" />,
      title: "Partnerships",
      description:
        "Explore collaboration opportunities and integration partnerships.",
      email: "partnerships@batchpay.com",
      note: "Let's build together",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-[#13151A] border border-[#1E2128] rounded-2xl p-6 md:p-8 flex flex-col items-start shadow-lg transition-transform hover:-translate-y-1 hover:border-[#2A2E39] duration-300"
        >
          <div className="bg-[#00E676]/10 p-3 rounded-lg mb-6 flex items-center justify-center">
            {card.icon}
          </div>
          <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
            {card.title}
          </h3>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            {card.description}
          </p>
          <a
            href={`mailto:${card.email}`}
            className="text-[#00E676] hover:text-[#00C853] font-medium text-sm transition-colors mb-2"
          >
            {card.email}
          </a>
          <p className="text-gray-500 text-xs">{card.note}</p>
        </div>
      ))}
    </div>
  );
}
