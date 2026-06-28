/**
 * Accessibility regression guard for #569.
 *
 * The demo page (`app/demo/page.tsx`) renders fatal / validation errors in a
 * styled container when `error` state is set. It was a plain <div> with no
 * `role="alert"`, so screen readers did not announce batch submission failures,
 * signing cancellations, or parse errors when they appeared dynamically.
 *
 * Asserting the announcement at runtime would need jsdom + an a11y tree; instead
 * we statically pin that the error banner carries `role="alert"` (the same
 * convention used by ManualBatchEntry and ui/field.tsx), which is exactly the
 * attribute that makes the live region announce on insertion.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const DEMO_PAGE = path.join(process.cwd(), "app", "demo", "page.tsx");
const SOURCE = readFileSync(DEMO_PAGE, "utf8");

describe("demo page error banner accessibility (#569)", () => {
  test("renders the error block only when error state is set", () => {
    // Guards against the banner being made always-present (which would make a
    // role="alert" region announce stale/empty content).
    expect(SOURCE).toMatch(/\{error && \(/);
  });

  test("error banner container declares role=\"alert\"", () => {
    // The error <div> (styled with the destructive palette) must carry
    // role="alert" so it is an assertive live region.
    const errorBlock = SOURCE.slice(
      SOURCE.indexOf("{error && ("),
      SOURCE.indexOf("{error && (") + 400,
    );
    expect(errorBlock).toMatch(/role="alert"/);
    expect(errorBlock).toMatch(/bg-destructive\/10/);
  });
});
