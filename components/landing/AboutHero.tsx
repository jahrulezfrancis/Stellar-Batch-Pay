'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const AboutHero = () => {
    return (
        <section className="relative w-full py-24 md:py-32 lg:py-48 overflow-hidden bg-[#0B0E14] flex flex-col items-center justify-center selection:bg-[#00D4AA]/30 selection:text-[#00D4AA]">
            {/* Left Background Glow */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-[30%] w-[60vw] h-[60vw] md:-left-[20%] md:w-[50vw] md:h-[50vw] lg:-left-[15%] lg:w-[45vw] lg:h-[45vw] bg-[#00D4AA]/[0.05] rounded-full blur-[100px] pointer-events-none" />
            
            {/* Right Background Glow */}
            <div className="absolute top-1/2 -translate-y-1/2 -right-[30%] w-[60vw] h-[60vw] md:-right-[20%] md:w-[50vw] md:h-[50vw] lg:-right-[15%] lg:w-[45vw] lg:h-[45vw] bg-[#00D4AA]/[0.05] rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center text-center space-y-10 md:space-y-12">
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]"
                >
                    <div className="w-2 h-2 rounded-full bg-[#00D4AA] shadow-[0_0_8px_rgba(0,212,170,0.8)]" />
                    <span className="text-sm font-medium text-gray-300 tracking-wide">Powered by Stellar Blockchain</span>
                </motion.div>

                {/* Main Content */}
                <div className="space-y-8">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-[64px] font-extrabold tracking-tight text-white leading-[1.1]"
                    >
                        About Stellar BatchPay
                    </motion.h1>

                    <div className="space-y-6">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-xl md:text-2xl lg:text-[28px] text-[#00D4AA] font-medium max-w-3xl mx-auto leading-snug tracking-tight"
                        >
                            Simplifying bulk cryptocurrency payments on the Stellar blockchain.
                        </motion.h2>

                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="text-base md:text-[18px] text-[#9CA3AF] max-w-[620px] mx-auto leading-[1.8]"
                        >
                            Our platform helps teams automate cryptocurrency payouts efficiently and securely, eliminating manual processes and reducing operational overhead while maintaining complete transparency and control.
                        </motion.p>
                    </div>
                </div>
            </div>
        </section>
    );
};
