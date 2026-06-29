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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";

export function SecuritySettingsCard() {
  const { toast } = useToast();
  const [twoFactor, setTwoFactor] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [manageSessionsOpen, setManageSessionsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: t("settings.missingFieldsTitle"),
        description: t("settings.missingFieldsDescription"),
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: t("settings.passwordsMismatchTitle"),
        description: t("settings.passwordsMismatchDescription"),
        variant: "destructive",
      });
      return;
    }
    toast({
      title: t("settings.passwordChangedTitle"),
      description: t("settings.passwordChangedDescription"),
    });
    setChangePasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const rows = [
    {
      id: "password",
      title: t("settings.password"),
      description: t("settings.passwordDescription"),
      action: (
        <Button
          size="sm"
          onClick={() => setChangePasswordOpen(true)}
          className="shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white"
        >
          {t("settings.change")}
        </Button>
      ),
    },
    {
      id: "2fa",
      title: t("settings.twoFactor"),
      description: t("settings.twoFactorDescription"),
      action: (
        <Switch
          checked={twoFactor}
          onCheckedChange={(v) => {
            setTwoFactor(v);
            toast({
              title: v ? t("settings.twoFactorEnabledTitle") : t("settings.twoFactorDisabledTitle"),
              description: v
                ? t("settings.twoFactorEnabledDescription")
                : t("settings.twoFactorDisabledDescription"),
            });
          }}
          className="data-[state=checked]:bg-emerald-500 shrink-0"
        />
      ),
    },
    {
      id: "alerts",
      title: t("settings.securityAlerts"),
      description: t("settings.securityAlertsDescription"),
      action: (
        <Switch
          checked={securityAlerts}
          onCheckedChange={(v) => {
            setSecurityAlerts(v);
            toast({
              title: v ? t("settings.securityAlertsEnabledTitle") : t("settings.securityAlertsDisabledTitle"),
              description: v
                ? t("settings.securityAlertsEnabledDescription")
                : t("settings.securityAlertsDisabledDescription"),
            });
          }}
          className="data-[state=checked]:bg-emerald-500 shrink-0"
        />
      ),
    },
    {
      id: "sessions",
      title: t("settings.activeSessions"),
      description: t("settings.activeSessionsDescription"),
      action: (
        <Button
          size="sm"
          onClick={() => setManageSessionsOpen(true)}
          className="shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white"
        >
          {t("settings.manage")}
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
                {t("settings.securityTitle")}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {t("settings.securityDescription")}
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

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{t("settings.changePasswordTitle")}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {t("settings.changePasswordDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">{t("settings.currentPassword")}</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11 bg-slate-950 border-slate-800/50 text-white focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{t("settings.newPassword")}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 bg-slate-950 border-slate-800/50 text-white focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{t("settings.confirmNewPassword")}</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 bg-slate-950 border-slate-800/50 text-white focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setChangePasswordOpen(false)}
              className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleChangePassword}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {t("settings.updatePassword")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Sessions Dialog */}
      <Dialog open={manageSessionsOpen} onOpenChange={setManageSessionsOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{t("settings.activeSessions")}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {t("settings.activeSessionsDialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { device: "Chrome on macOS", location: "Lagos, NG", current: true, time: "Now" },
              { device: "Safari on iPhone", location: "Lagos, NG", current: false, time: "2 hours ago" },
            ].map((session, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800/50"
              >
                <div className="space-y-0.5">
                  <div className="text-sm text-white font-medium flex items-center gap-2">
                    {session.device}
                    {session.current && (
                      <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">
                        {t("settings.currentSession")}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {session.location} · {session.time}
                  </div>
                </div>
                {!session.current && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs h-7"
                    onClick={() => {
                      toast({ title: t("settings.sessionRevokedTitle"), description: t("settings.sessionRevokedDescription", { device: session.device }) });
                      setManageSessionsOpen(false);
                    }}
                  >
                    {t("settings.revoke")}
                  </Button>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setManageSessionsOpen(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white"
            >
              {t("common.done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}