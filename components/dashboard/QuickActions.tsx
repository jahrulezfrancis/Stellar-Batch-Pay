"use client";

import Link from "next/link";
import { Plus, Download, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <Card className={cn("border-[#1F2937] bg-[#121827]", className)}>
      <CardContent className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>

        <Button
          asChild
          className="w-full h-12 bg-[#00D98B] hover:bg-[#00D98B]/90 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
        >
          <Link href="/dashboard/new-batch" aria-label="Start a new batch payment">
            <Plus className="h-5 w-5" />
            Start New Batch Payment
          </Link>
        </Button>

        <Button
          asChild
          variant="ghost"
          className="w-full h-12 bg-[#1F2937]/30 hover:bg-[#1F2937]/50 text-gray-300 font-medium rounded-lg flex items-center justify-center gap-2"
        >
          <a
            href="/templates/batch-payments-template.csv"
            download="batch-payments-template.csv"
            aria-label="Download the CSV template for batch payments"
          >
            <Download className="h-4 w-4" />
            Download Template
          </a>
        </Button>

        <Button
          asChild
          variant="ghost"
          className="w-full h-12 bg-[#1F2937]/30 hover:bg-[#1F2937]/50 text-gray-300 font-medium rounded-lg flex items-center justify-center gap-2"
        >
          <Link href="/dashboard/history" aria-label="View your recent batches">
            <RotateCcw className="h-4 w-4" />
            View Recent Batches
          </Link>
        </Button>

        <div className="mt-6 p-4 bg-[#00D98B]/10 border border-[#00D98B]/20 rounded-lg">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-[#00D98B] shrink-0 mt-0.5" />
            <div>
              <p className="text-[#00D98B] font-medium text-sm mb-1">Tip</p>
              <p className="text-gray-400 text-sm">
                Use CSV templates for faster batch uploads
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
