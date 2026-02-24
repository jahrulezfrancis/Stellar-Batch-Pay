"use client";

import { motion } from "framer-motion";
import { Zap, ShieldCheck, Eye, GitMerge } from "lucide-react";

const pillars = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Efficiency",
    description: "Reduce payment processing time from hours to minutes",
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "Reliability",
    description: "Built on Stellar's proven blockchain infrastructure",
  },
  {
    icon: <Eye className="h-6 w-6" />,
    title: "Transparency",
    description: "Complete visibility into every transaction and fee",
  },
  {
    icon: <GitMerge className="h-6 w-6" />,
    title: "Scalability",
    description: "Handle thousands of payments without complexity",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function MissionSection() {
  return (
    <section className="py-28 bg-[#0A0E1A] text-white overflow-hidden border-t border-[#E5E7EB1A]">
      <div className="container mx-auto px-4 md:px-6 flex flex-col items-center text-center relative">
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-[#00D98B08] blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#00D98B40] bg-[#00D98B10] text-[#00D98B] text-sm font-medium tracking-wide">
            Our Mission
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6 max-w-3xl"
        >
          Empowering Financial Operations in Web3
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[#8B92B0] text-base md:text-lg max-w-xl mb-16 leading-relaxed"
        >
          We&apos;re building infrastructure that makes blockchain payments as
          simple and reliable as traditional financial systems, enabling
          businesses to operate efficiently in the decentralized economy.
        </motion.p>

        {/* Pillar Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl"
        >
          {pillars.map((pillar) => (
            <motion.div
              key={pillar.title}
              variants={item}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="flex flex-col items-center text-center p-8 rounded-2xl bg-[#111827] border border-[#1F2937] hover:border-[#00D98B33] transition-all duration-200"
            >
              {/* Icon */}
              <div className="mb-5 h-14 w-14 rounded-xl bg-[#00D98B1A] border border-[#00D98B33] flex items-center justify-center text-[#00D98B]">
                {pillar.icon}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                {pillar.title}
              </h3>
              <p className="text-sm text-[#8B92B0] leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
