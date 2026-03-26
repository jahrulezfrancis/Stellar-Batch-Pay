"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFreighter } from "@/hooks/use-freighter";
import { Copy, Wallet, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AccountProfileCard } from "@/components/dashboard/settings/AccountProfileCard";
import { NotificationsCard } from "@/components/dashboard/settings/NotificationsCard";
import { DangerZoneCard } from "@/components/dashboard/settings/DangerZoneCard";

export default function SettingsPage() {
  const { publicKey, connect, disconnect, isConnecting } = useFreighter();
  const { toast } = useToast();

  const [defaultNetwork, setDefaultNetwork] = useState<string>("testnet");
  const [defaultAsset, setDefaultAsset] = useState<string>("xlm");
  const [batchValidation, setBatchValidation] = useState(true);
  const [completionNotifications, setCompletionNotifications] = useState(true);

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleSwitchWallet = async () => {
    disconnect();
    await connect();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">
          Manage your account settings and preferences
        </p>
      </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* AccountProfileCard takes 2/3 of the space */}
      <div className="lg:col-span-2">
        <AccountProfileCard />
      </div>
 
      {/* NotificationsCard takes 1/3 of the space */}
      <div className="lg:col-span-1">
        <NotificationsCard />
      </div>
    </div>
     

      {/* Wallet Connection Section */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Wallet className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl text-white">
                Wallet Connection
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage your Stellar wallet connection
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Info */}
          <div className="bg-slate-950/50 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status</span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${publicKey ? "bg-emerald-500" : "bg-slate-500"}`}
                />
                <span className="text-white font-medium">
                  {publicKey ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Network</span>
              <span className="text-white font-medium">Testnet</span>
            </div>

            {publicKey && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Wallet Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">
                    {truncateAddress(publicKey)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="h-8 w-8 p-0 hover:bg-slate-800"
                  >
                    <Copy className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {publicKey ? (
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
                onClick={handleSwitchWallet}
                disabled={isConnecting}
              >
                Switch Wallet
              </Button>
              <Button
                variant="destructive"
                className="flex-1 bg-red-900/20 border border-red-900/50 hover:bg-red-900/30 text-red-400"
                onClick={disconnect}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={connect}
              disabled={isConnecting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Payment Preferences Section */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Layers className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl text-white">
                Payment Preferences
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure default payment settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Network */}
          <div className="space-y-3">
            <label className="text-sm text-slate-400 font-medium">
              Default Network
            </label>
            <Select value={defaultNetwork} onValueChange={setDefaultNetwork}>
              <SelectTrigger className="w-full h-16 bg-slate-900 border-slate-800/50 text-white hover:bg-slate-950 [&_svg]:text-white [&_svg]:opacity-100 text-lg px-4 [&_svg]:size-5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem
                  value="testnet"
                  className="text-white hover:bg-slate-800 text-base py-3"
                >
                  Testnets
                </SelectItem>
                <SelectItem
                  value="mainnet"
                  className="text-white hover:bg-slate-800 text-base py-3"
                >
                  Mainnet
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Asset */}
          <div className="space-y-3">
            <label className="text-sm text-slate-400 font-medium">
              Default Asset
            </label>
            <Select value={defaultAsset} onValueChange={setDefaultAsset}>
              <SelectTrigger className="w-full h-16 bg-slate-950 border-slate-800/50 text-white hover:bg-slate-950 [&_svg]:text-white [&_svg]:opacity-100 text-lg px-4 [&_svg]:size-5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem
                  value="xlm"
                  className="text-white hover:bg-slate-800 text-base py-3"
                >
                  XLM (Stellar Lumens)
                </SelectItem>
                <SelectItem
                  value="usdc"
                  className="text-white hover:bg-slate-800 text-base py-3"
                >
                  USDC
                </SelectItem>
                <SelectItem
                  value="usdt"
                  className="text-white hover:bg-slate-800 text-base py-3"
                >
                  USDT
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Batch Validation Toggle */}
          <div className="flex items-start justify-between py-4 border-t border-slate-800">
            <div className="space-y-1">
              <div className="text-white font-medium">Batch Validation</div>
              <div className="text-sm text-slate-400">
                Validate recipients before processing
              </div>
            </div>
            <Switch
              checked={batchValidation}
              onCheckedChange={setBatchValidation}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {/* Completion Notifications Toggle */}
          <div className="flex items-start justify-between py-4 border-t border-slate-800">
            <div className="space-y-1">
              <div className="text-white font-medium">
                Completion Notifications
              </div>
              <div className="text-sm text-slate-400">
                Get notified when batches complete
              </div>
            </div>
            <Switch
              checked={completionNotifications}
              onCheckedChange={setCompletionNotifications}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </CardContent>
      </Card>
      <DangerZoneCard />

    </div>
  );
}
