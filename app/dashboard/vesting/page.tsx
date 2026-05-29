"use client";

import { useState, useRef } from "react";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import type { PaymentInstruction } from "@/lib/stellar/types";

interface VestingSchedule {
  id: string;
  recipient: string;
  amount: string;
  asset: string;
  startTime: number;
  endTime: number;
  vestingStep: number;
  claimableAmount: string;
  claimedAmount: string;
  status: "pending" | "vesting" | "claimable" | "completed";
  transactionHash?: string;
}

interface VestingBatch {
  id: string;
  name: string;
  createdAt: string;
  totalRecipients: number;
  totalAmount: string;
  status: "draft" | "submitted" | "completed";
  schedules: VestingSchedule[];
}

export default function VestingPage() {
  const { publicKey, expectedNetwork } = useWallet();
  const [activeTab, setActiveTab] = useState<"deposit" | "manage" | "claim">("deposit");
  const [batches, setBatches] = useState<VestingBatch[]>([]);
  const [currentBatch, setCurrentBatch] = useState<VestingBatch | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [vestingConfig, setVestingConfig] = useState({
    startDate: "",
    endDate: "",
    vestingStep: "86400", // 1 day in seconds
  });

  const handleFileSelect = async (file: File) => {
    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setIsUploading(true);
      const content = await file.text();
      const lines = content.split("\n").filter((line) => line.trim());

      const schedules: VestingSchedule[] = [];
      const recipients = new Set<string>();
      let totalAmount = "0";

      for (let i = 1; i < lines.length; i++) {
        const [address, amount, asset, memo] = lines[i].split(",");
        if (!address || !amount) continue;

        recipients.add(address.trim());
        schedules.push({
          id: `${i}`,
          recipient: address.trim(),
          amount: amount.trim(),
          asset: asset?.trim() || "XLM",
          startTime: vestingConfig.startDate
            ? Math.floor(new Date(vestingConfig.startDate).getTime() / 1000)
            : Math.floor(Date.now() / 1000),
          endTime: vestingConfig.endDate
            ? Math.floor(new Date(vestingConfig.endDate).getTime() / 1000)
            : Math.floor(Date.now() / 1000) + 7776000, // 90 days default
          vestingStep: parseInt(vestingConfig.vestingStep),
          claimableAmount: "0",
          claimedAmount: "0",
          status: "pending",
        });
        totalAmount = (parseFloat(totalAmount) + parseFloat(amount)).toString();
      }

      const batch: VestingBatch = {
        id: `batch-${Date.now()}`,
        name: file.name,
        createdAt: new Date().toISOString(),
        totalRecipients: recipients.size,
        totalAmount,
        status: "draft",
        schedules,
      };

      setCurrentBatch(batch);
      toast.success(`Loaded ${schedules.length} vesting schedules`);
    } catch (err) {
      toast.error("Failed to parse vesting file");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitBatch = async () => {
    if (!currentBatch || !publicKey) {
      toast.error("No batch to submit or wallet not connected");
      return;
    }

    try {
      setIsProcessing(true);

      // Build vesting transaction
      const buildRes = await fetch("/api/vesting-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey,
          network: expectedNetwork,
          schedules: currentBatch.schedules,
          contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4", // placeholder
        }),
      });

      if (!buildRes.ok) {
        const data = await buildRes.json();
        throw new Error(data.error || "Failed to build transaction");
      }

      const { xdr } = await buildRes.json();

      // Sign transaction via wallet
      const submitRes = await fetch("/api/vesting-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xdr,
          network: expectedNetwork,
          batchId: currentBatch.id,
        }),
      });

      if (submitRes.ok) {
        const data = await submitRes.json();
        const submittedBatch: VestingBatch = {
          ...currentBatch,
          status: "submitted",
          schedules: currentBatch.schedules.map((s) => ({
            ...s,
            status: "vesting" as const,
            transactionHash: data.transactionHash,
          })),
        };
        setBatches([...batches, submittedBatch]);
        setCurrentBatch(null);
        toast.success("Vesting batch submitted successfully");
        setActiveTab("manage");
      } else {
        throw new Error("Failed to submit batch");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      toast.error(msg);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaim = async (schedule: VestingSchedule) => {
    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setIsProcessing(true);
      const claimRes = await fetch("/api/vesting-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey,
          network: expectedNetwork,
          recipient: schedule.recipient,
          amount: schedule.claimableAmount,
          contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
        }),
      });

      if (claimRes.ok) {
        const data = await claimRes.json();
        toast.success("Claim submitted successfully");
      } else {
        throw new Error("Failed to claim vesting");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Claim failed";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async (schedules: VestingSchedule[]) => {
    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!confirm("Are you sure you want to revoke these vesting schedules?")) {
      return;
    }

    try {
      setIsProcessing(true);
      const revokeRes = await fetch("/api/vesting-revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey,
          network: expectedNetwork,
          recipients: schedules.map((s) => s.recipient),
          contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
        }),
      });

      if (revokeRes.ok) {
        toast.success("Vesting schedules revoked successfully");
      } else {
        throw new Error("Failed to revoke vesting");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Revoke failed";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Batch Vesting Management
        </h1>
        <p className="text-gray-400">
          Create and manage time-locked payment schedules on Soroban
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1F2937]">
        <button
          onClick={() => setActiveTab("deposit")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "deposit"
              ? "border-b-2 border-emerald-500 text-emerald-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "manage"
              ? "border-b-2 border-emerald-500 text-emerald-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Manage
        </button>
        <button
          onClick={() => setActiveTab("claim")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "claim"
              ? "border-b-2 border-emerald-500 text-emerald-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Claims
        </button>
      </div>

      {/* Deposit Tab */}
      {activeTab === "deposit" && (
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">Upload Vesting Recipients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border-2 border-dashed border-slate-700 p-8 text-center">
                <Upload className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                <p className="text-sm text-slate-400 mb-4">
                  Upload a CSV file with recipient addresses and amounts
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isUploading ? "Uploading..." : "Choose File"}
                </Button>
              </div>

              {currentBatch && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-sm text-slate-400">Total Recipients</p>
                      <p className="text-2xl font-bold text-white">
                        {currentBatch.totalRecipients}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-sm text-slate-400">Total Amount</p>
                      <p className="text-2xl font-bold text-white">
                        {parseFloat(currentBatch.totalAmount).toFixed(2)} {currentBatch.schedules[0]?.asset}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-sm text-slate-400">Network</p>
                      <p className="text-2xl font-bold text-white capitalize">
                        {expectedNetwork}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Start Date</label>
                      <Input
                        type="datetime-local"
                        value={vestingConfig.startDate}
                        onChange={(e) =>
                          setVestingConfig({ ...vestingConfig, startDate: e.target.value })
                        }
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">End Date</label>
                      <Input
                        type="datetime-local"
                        value={vestingConfig.endDate}
                        onChange={(e) =>
                          setVestingConfig({ ...vestingConfig, endDate: e.target.value })
                        }
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSubmitBatch}
                      disabled={isProcessing}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                    >
                      {isProcessing ? "Submitting..." : "Submit Vesting Batch"}
                    </Button>
                    <Button
                      onClick={() => setCurrentBatch(null)}
                      variant="outline"
                      className="border-slate-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manage Tab */}
      {activeTab === "manage" && (
        <div className="space-y-6">
          {batches.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                <p className="text-slate-400">
                  No vesting batches yet. Start by uploading a batch in the Deposit tab.
                </p>
              </CardContent>
            </Card>
          ) : (
            batches.map((batch) => (
              <Card key={batch.id} className="bg-slate-900/50 border-slate-800 overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">{batch.name}</CardTitle>
                      <p className="text-sm text-slate-400 mt-1">
                        {batch.totalRecipients} recipients - {batch.totalAmount} total
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      batch.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {batch.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-700">
                        <tr>
                          <th className="text-left p-2 text-slate-400 font-medium">Recipient</th>
                          <th className="text-right p-2 text-slate-400 font-medium">Amount</th>
                          <th className="text-right p-2 text-slate-400 font-medium">Claimable</th>
                          <th className="text-right p-2 text-slate-400 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {batch.schedules.slice(0, 5).map((schedule) => (
                          <tr key={schedule.id} className="hover:bg-white/5">
                            <td className="p-2 text-slate-300 font-mono text-xs">
                              {schedule.recipient.slice(0, 8)}...
                            </td>
                            <td className="p-2 text-right text-white">
                              {parseFloat(schedule.amount).toFixed(2)} {schedule.asset}
                            </td>
                            <td className="p-2 text-right text-emerald-400">
                              {parseFloat(schedule.claimableAmount).toFixed(2)}
                            </td>
                            <td className="p-2 text-right">
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                                {schedule.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRevoke(batch.schedules)}
                      variant="destructive"
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Revoke All"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Claims Tab */}
      {activeTab === "claim" && (
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">Available Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">
                View and claim vesting tokens that have become available
              </p>
              {batches
                .flatMap((batch) =>
                  batch.schedules
                    .filter((s) => s.status === "claimable")
                    .map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg mb-3"
                      >
                        <div>
                          <p className="text-white font-medium">
                            {parseFloat(s.claimableAmount).toFixed(2)} {s.asset}
                          </p>
                          <p className="text-sm text-slate-400 font-mono">
                            {s.recipient.slice(0, 16)}...
                          </p>
                        </div>
                        <Button
                          onClick={() => handleClaim(s)}
                          disabled={isProcessing}
                          className="bg-emerald-500 hover:bg-emerald-600"
                        >
                          {isProcessing ? "Processing..." : "Claim"}
                        </Button>
                      </div>
                    ))
                )
                .slice(0, 10)}
              {batches.flatMap((b) => b.schedules).filter((s) => s.status === "claimable")
                .length === 0 && (
                <p className="text-slate-400 text-center py-8">
                  No claimable vesting tokens at this time
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
