'use client';

import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Headset } from 'lucide-react';

const features = [
  {
    icon: Lock,
    title: 'Bank-Level Security',
    description: 'End-to-end encryption and secure key management.',
  },
  {
    icon: ShieldCheck,
    title: 'Blockchain Verified',
    description: 'Every transaction recorded on the Stellar ledger for full transparency.',
  },
  {
    icon: Headset,
    title: '24/7 Support',
    description: 'Expert assistance available whenever needed.',
  },
];

export function SecuritySection() {
  return (
    <section className="py-24 bg-[#0A0E1A] text-white overflow-hidden border-t border-[#E5E7EB1A]">
      <div className="container px-4 md:px-6 mx-auto relative">
        {/* Background Gradient Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[#00D98B0D] blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Built with <span className="text-[#00D98B]">Security & Reliability</span> at the Core
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#8B92B0] text-lg"
          >
            Enterprise-grade security and blockchain transparency you can trust.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 bg-[#00D98B1A] rounded-2xl flex items-center justify-center mb-6 border border-[#00D98B33] group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-8 h-8 text-[#00D98B]" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-[#8B92B0] text-sm leading-relaxed max-w-[250px]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
