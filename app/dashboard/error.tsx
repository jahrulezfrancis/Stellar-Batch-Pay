"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught:", error);

    if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs").then(({ captureException }) => captureException(error));
    }
  }, [error]);

  const sentryEnabled =
    process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_SENTRY_DSN;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl font-bold text-white">
              Dashboard Error
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              The dashboard encountered an error while loading.{sentryEnabled ? " This has been reported to our team." : " Please retry or contact support if the issue persists."}
            </p>
            {process.env.NODE_ENV === "development" && (
              <div className="text-xs text-destructive font-mono bg-destructive/10 p-3 rounded mt-2">
                <p className="font-semibold mb-1">Error Details:</p>
                <p>{error.message}</p>
                {error.stack && (
                  <pre className="mt-2 text-[10px] overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={reset}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              Retry
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Reload Dashboard
            </Button>
          </div>

          {error.digest && (
            <p className="text-xs text-center text-muted-foreground">
              Reference ID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
