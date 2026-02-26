'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Rocket, FileText, Shield, Clock, Users } from 'lucide-react';
import { DashboardMockup } from './DashboardMockup';

export const Hero = () => {
    return (
        <section className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-[#0B0E14] selection:bg-[#00D4AA]/30 selection:text-[#00D4AA]">
            {/* Background noise/pattern could go here */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#00D4AA05_0%,transparent_50%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Content Left */}
                <div className="space-y-10 relative z-10">
                    <div className="space-y-6">
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl md:text-[60px] font-extrabold tracking-tight text-white leading-[1.1]"
                        >
                            Send Hundreds of <br />
                            <span className="text-[#00D4AA] drop-shadow-[0_0_30px_rgba(0,212,170,0.3)]">Crypto Payments</span> <br />
                            in Seconds.
                        </motion.h1>

                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-lg md:text-[24px] text-[#D1D5DB] font-[400px] max-w-xl leading-relaxed"
                        >
                            Upload a payment list, automate transactions, and distribute funds efficiently on the Stellar <br /> blockchain.
                            
                          
                        </motion.p>
                         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className='text-[#9CA3AF] text-[18px] max-w-[452px] '>
                             Reduce manual errors, lower transaction costs, and streamline bulk payouts.
                           </motion.div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-wrap gap-5 pt-4"
                    >
                        <Button className="bg-[#00D4AA] hover:bg-[#00B894] text-[#020B0D] font-bold px-8 py-7 rounded-2xl text-lg flex items-center gap-3 shadow-[0_10px_30px_rgba(0,212,170,0.2)] transition-all hover:scale-105 active:scale-95 group">
                            <Rocket className="w-5 h-5  fill-black" />
                            Start Batch Payment
                        </Button>
                        <Button variant="outline" className="border-[#4B5563] bg-[#00000000]/50 hover:bg-white/5 hover:text-[#00D4AA] text-white font-bold px-8 py-7 rounded-2xl text-lg flex items-center gap-3 backdrop-blur-sm transition-all hover:border-white/20 hover:scale-105 active:scale-95 group">
                            <FileText className="w-5 h-5 " />
                            View Documentation
                        </Button>
                    </motion.div>

                    {/* Trust Badges */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="flex items-center gap-8 pt-10"
                    >
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                            <Shield className="w-4 h-4 text-[#00D4AA]" />
                            Bank-level Security
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                            <Clock className="w-4 h-4 text-[#00D4AA]" />
                            99.9% Uptime
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                            <Users className="w-4 h-4 text-[#00D4AA]" />
                            10K+ Users
                        </div>
                    </motion.div>
                </div>

                {/* Content Right - Mockup */}
                <div className="relative">
                    <DashboardMockup />
                </div>
            </div>
        </section>
    );
};
