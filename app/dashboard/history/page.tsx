"use client";

import { motion } from "framer-motion";
import { HistoryFilterBar } from "@/components/dashboard/HistoryFilterBar";
import { HistoryTable } from "@/components/dashboard/HistoryTable";
import { Pagination } from "@/components/dashboard/Pagination";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { Card, CardContent } from "@/components/ui/card";

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Batch Payment History</h1>
        <p className="text-gray-400">Search and filter your past batch payment operations</p>
      </div>

        <h1 className="text-3xl font-bold tracking-tight text-white">
          Batch Payment History
        </h1>
        <p className="text-gray-400">
          Review past batch transactions, track payment statuses, and access
          detailed reports.
        </p>
      </div>

      {/* Metrics Grid */}
      <MetricsGrid />

      {/* Filter Bar */}
      <Card className="border-[#1F2937] bg-[#121827] shadow-lg">
        <CardContent className="p-6">
          <HistoryFilterBar />
        </CardContent>
      </Card>

      {/* History Table Container */}
      <Card className="border-[#1F2937] bg-[#121827] shadow-lg overflow-hidden">
        <CardContent className="p-0 sm:p-6">
          <HistoryTable />
          <div className="px-4 pb-4 sm:px-0 sm:pb-0">
            <Pagination />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
