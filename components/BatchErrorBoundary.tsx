"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface BatchErrorBoundaryProps {
  children: ReactNode;
  storageKey: string;
  onRestore?: (saved: unknown) => void;
}

interface BatchErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class BatchErrorBoundary extends Component<
  BatchErrorBoundaryProps,
  BatchErrorBoundaryState
> {
  state: BatchErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
  };

  static getDerivedStateFromError(error: Error): BatchErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Batch flow render error:", error, info);
  }

  private handleRestore = () => {
    const saved = window.sessionStorage.getItem(this.props.storageKey);
    if (saved && this.props.onRestore) {
      try {
        this.props.onRestore(JSON.parse(saved) as unknown);
      } catch (error) {
        console.error("Failed to restore batch flow state:", error);
      }
    }

    this.setState({
      hasError: false,
      errorMessage: null,
    });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
        <h2 className="text-lg font-semibold text-red-200">Batch flow needs to be restored</h2>
        <p className="mt-2 text-sm text-red-100/70">
          {this.state.errorMessage ?? "The batch screen failed to render."}
        </p>
        <Button onClick={this.handleRestore} className="mt-5">
          Try again
        </Button>
      </div>
    );
  }
}
