'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

const features = [
    {
        title: 'Reduce Operational Time Dramatically',
        description: 'Complete in minutes what used to take hours or days of manual work.',
    },
    {
        title: 'Lower Transaction Costs',
        description: "Leverage Stellar's minimal fees to maximize your payment efficiency.",
    },
    {
        title: 'Improve Payment Accuracy',
        description: 'Automated validation prevents human errors and costly mistakes.',
    },
    {
        title: 'Gain Transparent Transaction Tracking',
        description: 'Full visibility into every payment with comprehensive reporting.',
    },
    {
        title: 'Support Scalable Payout Workflows',
        description: 'Grow from dozens to thousands of payments without changing your process.',
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

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5,
        },
    },
};

export function WhyTeamsChooseBatchPay() {
    return (
        <section className="py-24 bg-[#0A0E1A] text-white overflow-hidden border-t border-[#E5E7EB1A]">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column: Content */}
                    <div className="max-w-xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                                Why Teams Choose <br />
                                <span className="text-[#00D98B]">BatchPay</span>
                            </h2>
                            <p className="text-[#8B92B0] text-lg mb-10 leading-relaxed">
                                Built by payment professionals who understand the challenges of scaling crypto operations.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    className="flex gap-5 group"
                                >
                                    <div className="mt-1 flex-shrink-0">
                                        <div className="w-8 h-8 border border-[#E5E7EB1A] bg-white/5 rounded-[8px] flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#00D98B"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="w-4 h-4"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#00D98B] transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-[#8B92B0] text-base leading-relaxed max-w-md">
                                            {feature.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right Column: Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative h-[300px] sm:h-[400px] lg:h-[600px] rounded-[1px] overflow-hidden shadow-2xl"
                    >
                        <Image
                            src="/images/why-choose-us.png"
                            alt="Team collaborating in office"
                            fill
                            className="object-cover"
                        />
                        {/* Gradient Overlay for integration */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A80] to-transparent pointer-events-none" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
