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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Wallet, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFreighter } from "@/hooks/use-freighter";

type ConfirmAction = "disconnect" | "delete" | null;

export function DangerZoneCard() {
  const { toast } = useToast();
  const { disconnect } = useFreighter();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const handleConfirm = () => {
    if (confirmAction === "disconnect") {
      disconnect();
      toast({
        title: "Wallets disconnected",
        description: "All wallet connections have been removed.",
        variant: "destructive",
      });
    } else if (confirmAction === "delete") {
      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted.",
        variant: "destructive",
      });
    }
    setConfirmAction(null);
  };

  const actions = [
    {
      id: "disconnect" as ConfirmAction,
      title: "Disconnect All Wallets",
      description: "Remove all wallet connections",
      buttonLabel: "Disconnect",
      dialogTitle: "Disconnect All Wallets?",
      dialogDescription:
        "This will remove all connected wallet addresses from your account. You will need to reconnect your wallet to use the app.",
    },
    {
      id: "delete" as ConfirmAction,
      title: "Delete Account",
      description: "Permanently delete your account and all data",
      buttonLabel: "Delete",
      dialogTitle: "Delete Account?",
      dialogDescription:
        "This action is irreversible. Your account, payment history, and all associated data will be permanently deleted. There is no way to recover this information.",
    },
  ];

  return (
    <>
      <Card className="bg-red-950/30 border-red-900/40">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl text-red-400">
                Danger Zone
              </CardTitle>
              <CardDescription className="text-slate-400">
                Irreversible actions - proceed with caution
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-0">
          {actions.map((action, index) => (
            <div
              key={action.id}
              className={`flex items-center justify-between gap-4 py-5 ${
                index !== 0 ? "border-t border-red-900/30" : ""
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="text-white font-semibold">{action.title}</div>
                <div className="text-sm text-slate-400">
                  {action.description}
                </div>
              </div>
              <Button
                onClick={() => setConfirmAction(action.id)}
                className="shrink-0 bg-red-900/50 hover:bg-red-900/80 border border-red-800/60 text-red-400 hover:text-red-300 transition-colors"
              >
                {action.buttonLabel}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent className="bg-slate-900 border-red-900/50 max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-red-500/10 rounded-lg">
                {confirmAction === "disconnect" ? (
                  <Wallet className="w-5 h-5 text-red-500" />
                ) : (
                  <Trash2 className="w-5 h-5 text-red-500" />
                )}
              </div>
              <DialogTitle className="text-white text-lg">
                {actions.find((a) => a.id === confirmAction)?.dialogTitle}
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 text-sm leading-relaxed">
              {actions.find((a) => a.id === confirmAction)?.dialogDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="my-1 p-3 bg-red-950/40 border border-red-900/40 rounded-lg">
            <p className="text-xs text-red-400 font-medium">
              ⚠ This action cannot be undone.
            </p>
          </div>

          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-red-900/50 hover:bg-red-800/80 border border-red-800/60 text-red-300 hover:text-red-200"
            >
              {confirmAction === "disconnect"
                ? "Yes, Disconnect"
                : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}