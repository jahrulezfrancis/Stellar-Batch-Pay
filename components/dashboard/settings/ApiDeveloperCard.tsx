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
import { Code2, Eye, EyeOff, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";

const MASKED_KEY = "stellar_live_••••••••••••••7×9K";
const FULL_KEY = "stellar_live_abc123xyz456def789ghi012jkl7x9K";

export function ApiDeveloperCard() {
  const { toast } = useToast();
  const [keyVisible, setKeyVisible] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [apiKey, setApiKey] = useState(FULL_KEY);
  const [keyMeta, setKeyMeta] = useState({
    created: "Jan 15, 2025",
    lastUsed: "2 hours ago",
  });

  const displayKey = keyVisible
    ? apiKey
    : apiKey.slice(0, 8) + "••••••••••••••" + apiKey.slice(-4);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: t("settings.apiKeyCopiedTitle"),
      description: t("settings.apiKeyCopiedDescription"),
    });
  };

  const handleGenerate = () => {
    const newKey =
      "stellar_live_" +
      Math.random().toString(36).slice(2, 10) +
      Math.random().toString(36).slice(2, 10) +
      "7x9K";
    setApiKey(newKey);
    setKeyMeta({
      created: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      lastUsed: t("settings.justNow"),
    });
    setKeyVisible(false);
    setGenerateOpen(false);
    toast({
      title: t("settings.newApiKeyGeneratedTitle"),
      description: t("settings.newApiKeyGeneratedDescription"),
    });
  };

  const handleRevoke = () => {
    setRevokeOpen(false);
    toast({
      title: t("settings.apiKeyRevokedTitle"),
      description: t("settings.apiKeyRevokedDescription"),
      variant: "destructive",
    });
  };

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Code2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl text-white">
                {t("settings.apiDeveloperTitle")}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {t("settings.apiDeveloperDescription")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* API Key Display */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="text-sm text-white font-medium">
                  {t("settings.productionApiKey")}
                </div>
                <div className="text-sm font-mono text-slate-400 truncate">
                  {displayKey}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setKeyVisible((v) => !v)}
                  className="h-8 w-8 p-0 hover:bg-slate-800 text-slate-400 hover:text-white"
                  aria-label={keyVisible ? t("settings.hideApiKey") : t("settings.showApiKey")}
                >
                  {keyVisible ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 w-8 p-0 hover:bg-slate-800 text-slate-400 hover:text-white"
                  aria-label={t("settings.copyApiKey")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{t("settings.created", { date: keyMeta.created })}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>{t("settings.lastUsed", { time: keyMeta.lastUsed })}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setGenerateOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
            >
              {t("settings.generateNewKey")}
            </Button>
            <Button
              onClick={() => setRevokeOpen(true)}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white font-medium"
            >
              {t("settings.revokeKey")}
            </Button>
          </div>

          {/* API Docs Link */}
          <div className="flex justify-center pt-1">
            <a
              href="https://developers.stellar.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t("settings.viewApiDocumentation")}
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Generate New Key Confirmation */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{t("settings.generateApiKeyTitle")}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {t("settings.generateApiKeyDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="my-1 p-3 bg-amber-950/30 border border-amber-900/40 rounded-lg">
            <p className="text-xs text-amber-400 font-medium">
              ⚠ {t("settings.updateIntegrationsWarning")}
            </p>
          </div>
          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setGenerateOpen(false)}
              className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleGenerate}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {t("settings.yesGenerate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Key Confirmation */}
      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent className="bg-slate-900 border-red-900/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{t("settings.revokeApiKeyTitle")}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {t("settings.revokeApiKeyDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="my-1 p-3 bg-red-950/40 border border-red-900/40 rounded-lg">
            <p className="text-xs text-red-400 font-medium">
              ⚠ {t("settings.actionCannotBeUndone")}
            </p>
          </div>
          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setRevokeOpen(false)}
              className="flex-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleRevoke}
              className="flex-1 bg-red-900/50 hover:bg-red-800/80 border border-red-800/60 text-red-300"
            >
              {t("settings.yesRevoke")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}