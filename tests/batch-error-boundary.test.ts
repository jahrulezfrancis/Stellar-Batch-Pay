/**
 * Tests for the BatchErrorBoundary restore logic (#516).
 *
 * The boundary's "Try again" handler used to call `JSON.parse` on raw
 * sessionStorage data with no guard, so corrupt / partial / hand-edited storage
 * threw a SyntaxError out of the click handler and left the user stuck on the
 * error panel. Mounting the class component would need jsdom + testing-library;
 * following the repo convention (see demo-page-hooks.test.ts) we instead test
 * the pure, DOM-free decision function `restoreFromStorage` against a fake
 * storage, which is exactly what the handler delegates to.
 */

import { describe, expect, test, vi } from "vitest";
import {
  restoreFromStorage,
  isRestorablePayload,
} from "../components/BatchErrorBoundary";

/** Minimal in-memory Storage stand-in capturing removeItem calls. */
function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    removeItem: vi.fn((key: string) => {
      map.delete(key);
    }),
    has: (key: string) => map.has(key),
  };
}

describe("restoreFromStorage — corrupt JSON (#516)", () => {
  test("does not throw on invalid JSON and reports a corrupt outcome", () => {
    const storage = fakeStorage({ demo_batch_payments: "{broken" });

    let outcome!: ReturnType<typeof restoreFromStorage>;
    expect(() => {
      outcome = restoreFromStorage(storage, "demo_batch_payments");
    }).not.toThrow();

    expect(outcome.status).toBe("corrupt");
    if (outcome.status === "corrupt") {
      expect(outcome.message).toMatch(/corrupted/i);
    }
  });

  test("clears the corrupt key from storage after a failed parse", () => {
    const storage = fakeStorage({ demo_batch_payments: "not json at all" });

    restoreFromStorage(storage, "demo_batch_payments");

    expect(storage.removeItem).toHaveBeenCalledWith("demo_batch_payments");
    expect(storage.has("demo_batch_payments")).toBe(false);
  });
});

describe("restoreFromStorage — valid payloads", () => {
  test("restores a valid non-empty payments array", () => {
    const payments = [{ address: "GABC", amount: "10", asset: "XLM" }];
    const storage = fakeStorage({
      demo_batch_payments: JSON.stringify(payments),
    });

    const outcome = restoreFromStorage(storage, "demo_batch_payments");

    expect(outcome.status).toBe("restored");
    if (outcome.status === "restored") {
      expect(outcome.value).toEqual(payments);
    }
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  test("restores a valid object payload (new-batch state shape)", () => {
    const state = { step: 2, selectedNetwork: "testnet" };
    const storage = fakeStorage({ new_batch_state: JSON.stringify(state) });

    const outcome = restoreFromStorage(storage, "new_batch_state");

    expect(outcome.status).toBe("restored");
    if (outcome.status === "restored") {
      expect(outcome.value).toEqual(state);
    }
  });
});

describe("restoreFromStorage — empty and invalid shapes", () => {
  test("returns empty when nothing is saved", () => {
    const storage = fakeStorage();
    const outcome = restoreFromStorage(storage, "demo_batch_payments");
    expect(outcome.status).toBe("empty");
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  test("treats well-formed JSON that fails the validator as invalid and clears it", () => {
    // Valid JSON, but an empty array fails a 'non-empty payments' guard.
    const storage = fakeStorage({ demo_batch_payments: "[]" });

    const outcome = restoreFromStorage(
      storage,
      "demo_batch_payments",
      (parsed) => Array.isArray(parsed) && parsed.length > 0,
    );

    expect(outcome.status).toBe("invalid");
    expect(storage.removeItem).toHaveBeenCalledWith("demo_batch_payments");
  });
});

describe("isRestorablePayload — default guard", () => {
  test("accepts non-empty arrays and objects", () => {
    expect(isRestorablePayload([1])).toBe(true);
    expect(isRestorablePayload({ step: 1 })).toBe(true);
  });

  test("rejects empty arrays, empty objects, null, and primitives", () => {
    expect(isRestorablePayload([])).toBe(false);
    expect(isRestorablePayload({})).toBe(false);
    expect(isRestorablePayload(null)).toBe(false);
    expect(isRestorablePayload("string")).toBe(false);
    expect(isRestorablePayload(42)).toBe(false);
  });
});
