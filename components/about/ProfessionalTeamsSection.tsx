'use client';

import { motion } from 'framer-motion';
import {
  Layers,
  ShieldCheck,
  Globe,
  BarChart3,
  Lock,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    icon: Layers,
    title: 'Bulk Payment Automation',
    description:
      'Process hundreds of payments simultaneously with a single click. Upload CSV files or use our API for seamless integration.',
  },
  {
    icon: ShieldCheck,
    title: 'Payment Validation',
    description:
      'Automatic address verification, balance checks, and duplicate detection prevent costly errors before execution.',
  },
  {
    icon: Globe,
    title: 'Stellar Integration',
    description:
      'Native support for XLM and all Stellar assets with fast settlement times and minimal transaction fees.',
  },
  {
    icon: BarChart3,
    title: 'Transparent Reporting',
    description:
      'Real-time transaction tracking, comprehensive audit logs, and exportable reports for accounting purposes.',
  },
  {
    icon: Lock,
    title: 'Secure Transactions',
    description:
      'Multi-signature support, hardware wallet integration, and encrypted storage protect your assets at every step.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description:
      'Role-based access controls, approval workflows, and activity monitoring for collaborative operations.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function ProfessionalTeamsSection() {
  return (
    <section className="py-24 bg-[#0A0E1A] text-white overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <span
              className="inline-block mb-6 px-4 py-1.5 rounded-full text-sm font-semibold tracking-[-0.5px]"
              style={{
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              Key Features
            </span>

            <h2
              className="text-3xl md:text-[36px] font-bold tracking-[-0.5px] mb-4"
              style={{ color: '#F3F4F6', lineHeight: '40px' }}
            >
              Built for Professional Teams
            </h2>

            <p
              className="text-lg tracking-[-0.5px]"
              style={{ color: '#9CA3AF', lineHeight: '28px' }}
            >
              Everything you need to manage bulk cryptocurrency payments with
              confidence and precision.
            </p>
          </motion.div>
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="rounded-xl p-8 border transition-colors duration-300 hover:border-[#10B981]/30"
              style={{
                backgroundColor: '#0F1420',
                borderColor: '#252B3D',
              }}
            >
              {/* Icon Container */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
              >
                <feature.icon
                  className="w-6 h-6"
                  style={{ color: '#10B981' }}
                  strokeWidth={1.5}
                />
              </div>

              {/* Card Title */}
              <h3
                className="text-xl font-semibold tracking-[-0.5px] mb-3"
                style={{ color: '#F3F4F6', lineHeight: '28px' }}
              >
                {feature.title}
              </h3>

              {/* Card Description */}
              <p
                className="text-base tracking-[-0.5px]"
                style={{ color: '#9CA3AF', lineHeight: '24px' }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
