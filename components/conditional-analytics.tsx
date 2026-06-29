"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";

const CONSENT_KEY = "analytics_consent";

function analyticsEnabledByEnv(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true";
}

export function ConditionalAnalytics() {
  const [consented, setConsented] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsented(localStorage.getItem(CONSENT_KEY) === "true");
    setReady(true);
  }, []);

  if (!analyticsEnabledByEnv() || !ready || !consented) {
    return null;
  }

  return <Analytics />;
}

export function setAnalyticsConsent(allowed: boolean): void {
  if (typeof window === "undefined") return;
  if (allowed) {
    localStorage.setItem(CONSENT_KEY, "true");
  } else {
    localStorage.removeItem(CONSENT_KEY);
  }
}
