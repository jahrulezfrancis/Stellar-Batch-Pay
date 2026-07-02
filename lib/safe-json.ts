/**
 * JSON serialization helper that safely converts BigInt values to strings.
 *
 * Next.js API routes use JSON.stringify internally, which throws a TypeError
 * when the payload contains BigInt values (common in Stellar SDK responses).
 * This module provides a drop-in NextResponse.json replacement that handles
 * BigInt serialization transparently.
 */

import { NextResponse } from "next/server";

/**
 * JSON replacer that converts BigInt values to strings.
 */
function bigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

/**
 * Drop-in replacement for NextResponse.json() that safely handles BigInt.
 *
 * Usage:
 *   return safeJsonResponse({ ledger: 123n, hash: "abc" });
 *   return safeJsonResponse({ error: "..." }, { status: 400 });
 */
export function safeJsonResponse(
  data: unknown,
  init?: ResponseInit,
): NextResponse {
  const body = JSON.stringify(data, bigIntReplacer);
  return new NextResponse(body, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

/**
 * Discriminated result of a {@link safeJsonParse} call.
 */
export type SafeJsonParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };

/**
 * Parses a JSON string without throwing.
 *
 * `JSON.parse` throws a `SyntaxError` on corrupt, partial, or manually edited
 * input. Callers that read untrusted storage (sessionStorage / localStorage,
 * which extensions or truncation can corrupt) should use this instead so a bad
 * payload becomes a handled `{ ok: false }` result rather than an uncaught
 * exception that crashes the surrounding UI (#516).
 *
 * @param raw - The string to parse. `null`/`undefined` are treated as failures.
 * @returns `{ ok: true, value }` on success, or `{ ok: false, error }` otherwise.
 *
 * @example
 * const result = safeJsonParse<Payment[]>(sessionStorage.getItem(key));
 * if (result.ok) restore(result.value);
 * else showError(result.error.message);
 */
export function safeJsonParse<T = unknown>(
  raw: string | null | undefined,
): SafeJsonParseResult<T> {
  if (typeof raw !== "string") {
    return { ok: false, error: new Error("No JSON string to parse") };
  }
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
