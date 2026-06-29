"use client";

import React, { useEffect } from "react";
import { Navbar } from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";

interface DemoErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DemoError({ error, reset }: DemoErrorProps) {
  useEffect(() => {
    // Log error digest in development only
    if (process.env.NODE_ENV === "development") {
      console.error("Demo error boundary caught error:", error);
      if (error.digest) {
        console.error("Error digest:", error.digest);
      }
    }
  }, [error]);

  const handleResetDemo = () => {
    sessionStorage.removeItem("demo_batch_payments");
    reset();
  };

  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div
          role="alert"
          aria-live="assertive"
          className="w-full bg-destructive/10 border border-destructive text-destructive rounded-lg p-6 mb-8 text-left"
        >
          <h2 className="text-xl font-bold mb-2">Demo Error</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while running the demo. You can try again, reset the demo to start fresh, or return to the home page.
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-xs font-mono bg-destructive/20 p-2 rounded mt-4 overflow-auto max-h-40">
              {error.message || "An unexpected error occurred."}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={reset}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          >
            Try again
          </Button>
          <Button
            onClick={handleResetDemo}
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            Reset demo
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Return home
          </Button>
        </div>
      </div>
    </main>
  );
}
