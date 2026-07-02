"use client";

import * as React from "react";
import { Bell, CheckCheck, Clock3, ExternalLink, Inbox, Trash2, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationsContext";

function formatRelativeTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.max(1, Math.round(diff / 60000));

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.round(hours / 24);
    return `${days}d ago`;
  } catch {
    return iso;
  }
}

export function NotificationsPanel() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAllNotificationsRead,
    markNotificationRead,
    clearNotifications,
  } = useNotifications();
  const [open, setOpen] = React.useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      markAllNotificationsRead();
    }
  };

  const openNotification = (id: string, href: string) => {
    markNotificationRead(id);
    setOpen(false);
    router.push(href);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative h-10 w-10 rounded-full border border-transparent text-gray-400 hover:border-[#2d4a4f] hover:bg-white/5 hover:text-white"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-[#00D98B] px-1 text-[10px] font-semibold text-[#08110f]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      <SheetContent side="right" className="border-[#1F2937] bg-[#0F1624] text-white sm:max-w-md">
        <SheetHeader className="border-b border-[#1F2937] px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <SheetTitle className="flex items-center gap-2 text-xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00D98B]/15 text-[#00D98B]">
                  <Bell className="h-4 w-4" />
                </span>
                Notifications
              </SheetTitle>
              <SheetDescription className="text-gray-400">
                Track recent batch completion and failure events without leaving the dashboard.
              </SheetDescription>
            </div>
            <Badge className="border border-[#1F2937] bg-white/5 text-gray-300">
              {notifications.length}
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex items-center justify-between gap-3 px-6 pt-4">
          <p className="text-sm text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={markAllNotificationsRead}
              className="text-gray-300 hover:bg-white/5 hover:text-white"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearNotifications}
              className="h-9 w-9 text-gray-400 hover:bg-white/5 hover:text-white"
              aria-label="Clear notifications"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setOpen(false);
                router.push("/dashboard/settings");
              }}
              className="h-9 w-9 text-gray-400 hover:bg-white/5 hover:text-white"
              aria-label="Notification preferences"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 pb-6 pt-4">
          <div className="space-y-3 pr-2">
            {notifications.length === 0 ? (
              <div className="flex h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#1F2937] bg-white/[0.02] text-center">
                <Inbox className="mb-3 h-10 w-10 text-gray-500" />
                <p className="font-medium text-white">No notifications yet</p>
                <p className="mt-1 max-w-xs text-sm text-gray-400">
                  Batch completion and failure alerts will appear here once jobs start finishing.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification.id, notification.href)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition-colors hover:border-[#00D98B]/40 hover:bg-white/[0.04]",
                    notification.read
                      ? "border-[#1F2937] bg-white/[0.02]"
                      : "border-[#00D98B]/30 bg-[#00D98B]/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-none text-[10px] uppercase tracking-wide",
                            notification.status === "completed"
                              ? "bg-[#00D98B]/15 text-[#00D98B]"
                              : "bg-red-500/15 text-red-300",
                          )}
                        >
                          {notification.status}
                        </Badge>
                        <Badge variant="outline" className="border-[#1F2937] text-gray-400">
                          {notification.network === "mainnet" ? "Mainnet" : "Testnet"}
                        </Badge>
                        {!notification.read ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#00D98B]" />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium text-white">{notification.title}</p>
                        <p className="mt-1 text-sm leading-6 text-gray-400">{notification.description}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-gray-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span className="text-xs">{formatRelativeTime(notification.createdAt)}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#1F2937]/70 pt-3">
                    <span className="font-mono text-xs text-gray-500">{notification.jobId.slice(0, 8)}…</span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[#00D98B]">
                      Open batch
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
