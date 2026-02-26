import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Play, CheckCircle2, Shield, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";

export const DashboardMockup = () => {
    return (
        <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full max-w-2xl mx-auto"
        >
            {/* Window Frame */}
            <div className="bg-[#0B0E14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-[#00D4AA]/10 backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <span className="text-gray-500 text-xs font-mono">BatchPay Dashboard</span>
                </div>

                <div className="p-6 space-y-6">
                    {/* Upload Section Container */}
                    <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h4 className="text-sm font-semibold text-gray-300">Upload Payment File</h4>
                            <span className="text-[10px] font-bold text-[#00D4AA] tracking-wider">CSV/JSON</span>
                        </div>
                        
                        {/* Dashed Upload Box */}
                        <div className="border border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center gap-2 bg-black/20">
                            <div className="w-10 h-10 bg-[#00D4AA]/20 rounded-full flex items-center justify-center">
                                <Upload className="text-[#00D4AA] w-5 h-5" />
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-semibold text-gray-300">payments_batch_001.csv</p>
                            </div>
                        </div>
                    </div>

                    {/* Queue Header */}
                    <div className="pt-2 px-1">
                        <h4 className="text-sm font-medium text-gray-400">Payment Queue (247 transactions)</h4>
                    </div>
                        <div className="space-y-2">
                            {[
                                { addr: "GDXN...7XYZ", amount: "1,250 XLM" },
                                { addr: "GCAP...4ABC", amount: "890 XLM" },
                                { addr: "GDEF...9MNO", amount: "2,100 XLM" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5 group hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-[#00D4AA]" />
                                        <span className="text-sm text-gray-300 font-mono">{item.addr}</span>
                                        <span className="text-sm text-white font-bold">{item.amount}</span>
                                    </div>
                                    <span className="text-xs text-[#00D4AA] font-semibold">Ready</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 text-center pt-2 italic">+ 244 more transactions</p>
                    </div>

                    {/* Action Button */}
                    <Button className="w-full bg-[#00D4AA] hover:bg-[#00B894] text-[#020B0D] font-bold py-6 rounded-xl text-md flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(0,212,170,0.2)]">
                        <Play className="fill-[#020B0D] w-4 h-4 group-hover:scale-110 transition-transform" />
                        Execute Batch Payment
                    </Button>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 uppercase">Total Amount</p>
                            <p className="text-sm font-bold text-[#00D4AA]">1.2M XLM</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 uppercase">Est. Fees</p>
                            <p className="text-sm font-bold text-gray-300">0.02 XLM</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 uppercase">Duration</p>
                            <p className="text-sm font-bold text-gray-300">~45s</p>
                        </div>
                </div>
            </div>

      
        </motion.div>
    );
};
