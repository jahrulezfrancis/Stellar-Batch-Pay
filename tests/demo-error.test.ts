import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const ERROR_BOUNDARY_FILE = path.join(process.cwd(), "app", "demo", "error.tsx");
const SOURCE = readFileSync(ERROR_BOUNDARY_FILE, "utf8");

describe("demo error boundary tests", () => {
  test("declares use client at the very top", () => {
    const trimmed = SOURCE.trim();
    expect(trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'")).toBe(true);
  });

  test("implements role alert for accessibility", () => {
    expect(SOURCE).toMatch(/role="alert"/);
  });

  test("clears demo sessionStorage on reset action", () => {
    expect(SOURCE).toMatch(/sessionStorage\.removeItem\("demo_batch_payments"\)/);
  });

  test("renders buttons for Try again, Reset demo, and Return home", () => {
    expect(SOURCE).toMatch(/Try again/);
    expect(SOURCE).toMatch(/Reset demo/);
    expect(SOURCE).toMatch(/Return home/);
  });

  test("logs error to console in development only", () => {
    expect(SOURCE).toMatch(/process\.env\.NODE_ENV === "development"/);
    expect(SOURCE).toMatch(/console\.error\(/);
  });
});
