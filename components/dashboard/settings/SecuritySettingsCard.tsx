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
import { ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SecuritySettingsCard() {
  const { toast } = useToast();
  // NOTE: Stellar BatchPay uses wallet-based authentication.
  // This component previously exposed non-functional password/2FA/session controls.
  // Those claims are removed until a real backend implementation exists.
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const handleNotImplemented = () => {
    toast({
      title: "Not implemented",
      description:
        "Stellar BatchPay uses wallet-based authentication. Password and 2FA controls are not available. Use your Stellar wallet (Freighter/Ledger/etc.) for security.",
      variant: "default",
    });
  };

  const rows = [
    {
      id: "password",
      title: "Password",
      description: "Coming soon — Stellar BatchPay does not manage passwords for wallet-only accounts.",
      action: (
        <Button
          size="sm"
          variant="outline"
          onClick={handleNotImplemented}
          className="shrink-0 bg-slate-800/30 border-slate-700 text-slate-300"
        >
          Coming soon
        </Button>
      ),
    },
    {
      id: "2fa",
      title: "Two-Factor Authentication",
      description: "Coming soon — Use your Stellar wallet’s built-in security (Freighter/Ledger, etc.).",
      action: (
        <Button
          size="sm"
          variant="outline"
          onClick={handleNotImplemented}
          className="shrink-0 bg-slate-800/30 border-slate-700 text-slate-300"
        >
          Not available
        </Button>
      ),
    },
    {
      id: "alerts",
      title: "Security Alerts",
      description: "Local notification preferences (UI only).",
      action: (
        <Switch
          checked={securityAlerts}
          onCheckedChange={(v: boolean) => {
            setSecurityAlerts(v);
            toast({
              title: v ? "Security alerts enabled" : "Security alerts disabled",
              description: "This is a notification preference only (no backend/security action).",
            });
          }}
          className="data-[state=checked]:bg-emerald-500 shrink-0"
        />
      ),
    },
    {
      id: "sessions",
      title: "Active Sessions",
      description: "Coming soon — sessions are managed by your wallet connection.",
      action: (
        <Button
          size="sm"
          variant="outline"
          onClick={handleNotImplemented}
          className="shrink-0 bg-slate-800/30 border-slate-700 text-slate-300"
        >
          Coming soon
        </Button>
      ),
    },
  ];


  return (
    <>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl text-white">
                Security Settings
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage your account security
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-0">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={`flex items-center justify-between gap-4 py-4 ${
                index !== 0 ? "border-t border-slate-800" : ""
              }`}
            >
              <div className="space-y-0.5 min-w-0">
                <div className="text-white font-medium">{row.title}</div>
                <div className="text-sm text-slate-400">{row.description}</div>
              </div>
              {row.action}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-4 rounded-lg border border-slate-800/50 bg-slate-950/30 p-4">
        <div className="text-white font-medium">Wallet-based security</div>
        <div className="text-sm text-slate-400 mt-1">
          Stellar BatchPay authenticates with your Stellar wallet. Password and 2FA settings are not managed by this UI.
          For additional protection, secure your wallet (Freighter/Ledger/etc.), keep your recovery phrase safe, and revoke any unnecessary authorizations.
        </div>
      </div>
    </>
  );
}