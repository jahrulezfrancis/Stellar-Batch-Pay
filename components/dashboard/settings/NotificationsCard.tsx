"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import { t } from "@/lib/i18n";

export function NotificationsCard() {
  const [batchSuccess, setBatchSuccess] = useState(true);
  const [failedPayments, setFailedPayments] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);

  const notifications = [
    {
      id: "batch-success",
      label: t("settings.batchSuccess"),
      description: t("settings.batchSuccessDescription"),
      checked: batchSuccess,
      onChange: setBatchSuccess,
    },
    {
      id: "failed-payments",
      label: t("settings.failedPayments"),
      description: t("settings.failedPaymentsDescription"),
      checked: failedPayments,
      onChange: setFailedPayments,
    },
    {
      id: "email-alerts",
      label: t("settings.emailAlerts"),
      description: t("settings.emailAlertsDescription"),
      checked: emailAlerts,
      onChange: setEmailAlerts,
    },
  ];

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg">
            <Bell className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-2xl text-white">{t("settings.notificationsTitle")}</CardTitle>
            <CardDescription className="text-slate-400">
              {t("settings.notificationsDescription")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-0">
        {notifications.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-start justify-between py-4 ${
              index !== 0 ? "border-t border-slate-800" : ""
            }`}
          >
            <div className="space-y-1">
              <div className="text-white font-medium">{item.label}</div>
              <div className="text-sm text-slate-400">{item.description}</div>
            </div>
            <Switch
              checked={item.checked}
              onCheckedChange={item.onChange}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}