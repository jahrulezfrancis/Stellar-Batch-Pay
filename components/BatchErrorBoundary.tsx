"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { safeJsonParse } from "@/lib/safe-json";

interface BatchErrorBoundaryProps {
  children: ReactNode;
  storageKey: string;
  onRestore?: (saved: unknown) => void;
  /**
   * Optional type guard run against the parsed payload before `onRestore`.
   * Lets each caller assert the shape it expects (e.g. a payments array).
   * Defaults to {@link isRestorablePayload}, which accepts any non-empty
   * object or array.
   */
  validate?: (parsed: unknown) => boolean;
}

interface BatchErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
  restoreError: string | null;
}

/**
 * Default guard: a payload is restorable if it is a non-empty array or a
 * plain object with at least one key. Empty / `null` / primitive payloads are
 * treated as nothing meaningful to restore.
 */
export function isRestorablePayload(parsed: unknown): boolean {
  if (Array.isArray(parsed)) return parsed.length > 0;
  if (parsed !== null && typeof parsed === "object") {
    return Object.keys(parsed as Record<string, unknown>).length > 0;
  }
  return false;
}

const CORRUPT_MESSAGE =
  "Saved batch data was corrupted and could not be restored. It has been cleared — please start a new batch.";
const INVALID_MESSAGE =
  "Saved batch data was incomplete and could not be restored. It has been cleared — please start a new batch.";

export type RestoreOutcome =
  | { status: "empty" }
  | { status: "restored"; value: unknown }
  | { status: "corrupt"; message: string }
  | { status: "invalid"; message: string };

/**
 * Pure restore decision shared by the boundary and its tests.
 *
 * Reads `storageKey` from `storage`, parses it without throwing, and validates
 * the shape. Corrupt or invalid payloads are removed from storage so a poisoned
 * key cannot break the recovery flow on every retry (#516). Kept side-effect-
 * light (only `removeItem`) and DOM-free so it is unit-testable in Node with a
 * fake storage.
 */
export function restoreFromStorage(
  storage: Pick<Storage, "getItem" | "removeItem">,
  storageKey: string,
  validate: (parsed: unknown) => boolean = isRestorablePayload,
): RestoreOutcome {
  const saved = storage.getItem(storageKey);
  if (saved === null || saved === undefined) {
    return { status: "empty" };
  }

  const parsed = safeJsonParse(saved);
  if (!parsed.ok) {
    console.error("Failed to restore batch flow state:", parsed.error);
    storage.removeItem(storageKey);
    return { status: "corrupt", message: CORRUPT_MESSAGE };
  }

  if (!validate(parsed.value)) {
    storage.removeItem(storageKey);
    return { status: "invalid", message: INVALID_MESSAGE };
  }

  return { status: "restored", value: parsed.value };
}

export class BatchErrorBoundary extends Component<
  BatchErrorBoundaryProps,
  BatchErrorBoundaryState
> {
  state: BatchErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
    restoreError: null,
  };

  static getDerivedStateFromError(
    error: Error,
  ): Partial<BatchErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Batch flow render error:", error, info);
  }

  private handleRestore = () => {
    const { storageKey, onRestore, validate } = this.props;
    const outcome = restoreFromStorage(
      window.sessionStorage,
      storageKey,
      validate,
    );

    switch (outcome.status) {
      case "corrupt":
      case "invalid":
        // Never let a bad payload throw out of the click handler. Surface a
        // clear message and keep the recovery UI on screen so the user is not
        // stuck on the error panel.
        toast.error(outcome.message);
        this.setState({ restoreError: outcome.message });
        return;
      case "restored":
        onRestore?.(outcome.value);
        this.setState({
          hasError: false,
          errorMessage: null,
          restoreError: null,
        });
        return;
      case "empty":
      default:
        this.setState({
          hasError: false,
          errorMessage: null,
          restoreError: null,
        });
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center"
      >
        <h2 className="text-lg font-semibold text-red-200">
          Batch flow needs to be restored
        </h2>
        <p className="mt-2 text-sm text-red-100/70">
          {this.state.restoreError ??
            this.state.errorMessage ??
            "The batch screen failed to render."}
        </p>
        <Button onClick={this.handleRestore} className="mt-5">
          Try again
        </Button>
      </div>
    );
  }
}
