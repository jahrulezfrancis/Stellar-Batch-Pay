'use client';

import { motion } from 'framer-motion';
import { FileUp, ShieldCheck, Send, BarChart3 } from 'lucide-react';

const steps = [
  {
    icon: FileUp,
    title: 'Upload Payment File',
    description: 'Import your CSV or JSON file containing recipient addresses and amounts.',
  },
  {
    icon: ShieldCheck,
    title: 'Preview and Validate',
    description: 'Review all transactions and let our system validate addresses and amounts.',
  },
  {
    icon: Send,
    title: 'Submit Batch Payment',
    description: 'Confirm and execute all payments simultaneously on the Stellar network.',
  },
  {
    icon: BarChart3,
    title: 'Monitor Results',
    description: 'Track transaction status in real-time with detailed reports and confirmations.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function ProcessSection() {
  return (
    <section className="py-24 bg-[#0A0E1A] text-white overflow-hidden ">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Simple <span className="text-[#00D98B]">Four-Step Process</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#8B92B0] text-lg"
          >
            From upload to completion in minutes, not hours.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative group h-full"
            >
              {/* Step Number Badge */}
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#00D98B] text-[#0A0E1A] font-bold rounded-lg flex items-center justify-center z-10 shadow-lg group-hover:scale-110 transition-transform">
                {index + 1}
              </div>

              {/* Card */}
              <div className="h-full bg-[#1A1F2E80] border border-[#252B3D] rounded-2xl p-8 flex flex-col items-center text-center hover:border-[#00D98B4D] transition-colors group-hover:bg-[#1A1F2E]">
                <div className="w-16 h-16 bg-[#00D98B1A] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#00D98B2A] transition-colors">
                  <step.icon className="w-8 h-8 text-[#00D98B]" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-[#8B92B0] text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
