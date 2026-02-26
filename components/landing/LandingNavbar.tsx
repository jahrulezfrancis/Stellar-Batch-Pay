'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';

export const LandingNavbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-background/10 max-w-7xl mx-auto border-b border-white/5 mt-4 rounded-2xl">
            <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-10 h-10 bg-[#00D4AA]/20 rounded-xl flex items-center justify-center border border-[#00D4AA]/30 group-hover:bg-[#00D4AA]/30 transition-all duration-300 shadow-[0_0_15px_rgba(0,212,170,0.2)]">
                    <Layers className="text-[#00D4AA] w-6 h-6" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                    Stellar <span className="text-[#00D4AA]">BatchPay</span>
                </span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                <Link href="#features" className="hover:text-[#00D4AA] transition-colors">Features</Link>
                <Link href="#docs" className="hover:text-[#00D4AA] transition-colors">Documentation</Link>
                <Link href="#pricing" className="hover:text-[#00D4AA] transition-colors">Pricing</Link>
                <Link href="#about" className="hover:text-[#00D4AA] transition-colors">About</Link>
                <Link href="#contact" className="hover:text-[#00D4AA] transition-colors">Contact</Link>
            </div>

            <Button className="bg-[#00D4AA] hover:bg-[#00B894] text-[#020B0D] font-bold px-6 py-2 rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(0,212,170,0.3)] hover:scale-105 active:scale-95">
                Launch App
            </Button>
        </nav>
    );
};
