import { Plus, Download, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function QuickActions() {
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardContent className="p-6 space-y-6">
        <h2 className="text-xl font-bold text-white">Quick Actions</h2>

        <div className="space-y-3">
          <Link href="/dashboard/new-batch" className="block">
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
              <Plus className="w-5 h-5 mr-2" />
              Start New Batch Payment
            </Button>
          </Link>

          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Download className="w-5 h-5 mr-3" />
            Download Template
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <RotateCcw className="w-5 h-5 mr-3" />
            View Recent Batches
          </Button>
        </div>

        <div className="mt-6 p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center">
                <Info className="w-4 h-4 text-teal-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-400 mb-1">Tip</p>
              <p className="text-sm text-slate-400">
                Use CSV templates for faster batch uploads
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
