"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  buildDashboardNotification,
  DASHBOARD_NOTIFICATION_LIMIT,
  DASHBOARD_NOTIFICATION_STORAGE_KEY,
  hydrateDashboardNotifications,
  type BatchNotificationInput,
  type DashboardNotification,
} from "@/lib/dashboard/notifications";

interface NotificationsContextValue {
  notifications: DashboardNotification[];
  unreadCount: number;
  pushBatchNotification: (input: BatchNotificationInput) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DASHBOARD_NOTIFICATION_STORAGE_KEY);
      setNotifications(hydrateDashboardNotifications(stored));
    } catch {
      setNotifications([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      localStorage.setItem(
        DASHBOARD_NOTIFICATION_STORAGE_KEY,
        JSON.stringify(notifications.slice(0, DASHBOARD_NOTIFICATION_LIMIT)),
      );
    } catch {
      // Ignore storage failures; notifications still work in memory.
    }
  }, [hydrated, notifications]);

  const pushBatchNotification = useCallback((input: BatchNotificationInput) => {
    setNotifications((current) => {
      const next = buildDashboardNotification(input);
      const deduped = current.filter((item) => item.id !== next.id);
      return [next, ...deduped].slice(0, DASHBOARD_NOTIFICATION_LIMIT);
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo<NotificationsContextValue>(() => {
    return {
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      pushBatchNotification,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
    };
  }, [
    notifications,
    pushBatchNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  ]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }

  return context;
}
