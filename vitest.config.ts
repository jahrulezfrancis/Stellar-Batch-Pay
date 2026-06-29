import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // #363: e2e specs are owned by Playwright; vitest must skip them
    // otherwise it tries to collect them and fails on `@playwright/test`.
    exclude: ["**/node_modules/**", "tests/e2e/**", "tests/**/e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "../cli/index.js": path.resolve(__dirname, "cli/index.ts"),
      // cli/index.mjs has been removed; canonical source is cli/index.ts (#599)
    },
  },
});
