/**
 * Test suite for BigInt-safe JSON serialization
 */

import { describe, test, expect } from "vitest";
import { safeJsonParse } from "../lib/safe-json";

// Test the BigInt replacer logic directly since safeJsonResponse depends on Next.js
function bigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

function safeStringify(data: unknown): string {
  return JSON.stringify(data, bigIntReplacer);
}

describe("BigInt-safe JSON serialization", () => {
  test("converts BigInt to string", () => {
    const data = { ledger: BigInt(123456) };
    const result = safeStringify(data);
    expect(result).toBe('{"ledger":"123456"}');
  });

  test("handles nested BigInt values", () => {
    const data = {
      result: {
        ledger: BigInt(999),
        sequence: BigInt("18446744073709551615"),
      },
    };
    const result = JSON.parse(safeStringify(data));
    expect(result.result.ledger).toBe("999");
    expect(result.result.sequence).toBe("18446744073709551615");
  });

  test("preserves non-BigInt values", () => {
    const data = {
      hash: "abc123",
      success: true,
      count: 42,
      items: [1, 2, 3],
      nested: { key: "value" },
      empty: null,
    };
    const result = JSON.parse(safeStringify(data));
    expect(result).toEqual(data);
  });

  test("handles mixed BigInt and regular values", () => {
    const data = {
      hash: "abc",
      ledger: BigInt(100),
      success: true,
    };
    const result = JSON.parse(safeStringify(data));
    expect(result.hash).toBe("abc");
    expect(result.ledger).toBe("100");
    expect(result.success).toBe(true);
  });

  test("handles BigInt in arrays", () => {
    const data = { values: [BigInt(1), BigInt(2), BigInt(3)] };
    const result = JSON.parse(safeStringify(data));
    expect(result.values).toEqual(["1", "2", "3"]);
  });

  test("does not throw on BigInt values", () => {
    const data = { value: BigInt(123) };
    expect(() => safeStringify(data)).not.toThrow();
  });

  test("regular JSON.stringify throws on BigInt", () => {
    const data = { value: BigInt(123) };
    expect(() => JSON.stringify(data)).toThrow(TypeError);
  });
});

describe("safeJsonParse (#516)", () => {
  test("parses valid JSON into an ok result", () => {
    const result = safeJsonParse<{ a: number }>('{"a":1}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ a: 1 });
  });

  test("does not throw on corrupt JSON and returns an error result", () => {
    let result!: ReturnType<typeof safeJsonParse>;
    expect(() => {
      result = safeJsonParse("{broken");
    }).not.toThrow();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(Error);
  });

  test("returns an error result for null / undefined input", () => {
    expect(safeJsonParse(null).ok).toBe(false);
    expect(safeJsonParse(undefined).ok).toBe(false);
  });
});
