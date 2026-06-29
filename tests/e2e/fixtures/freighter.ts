/**
 * Playwright Freighter wallet stub fixture (#603).
 *
 * Injects a `window.freighterApi` stub via `page.addInitScript` so that
 * tests can exercise wallet-connected UI flows without a real browser
 * extension. The stub resolves immediately and returns deterministic values.
 *
 * Usage:
 *   import { test, expect } from "./fixtures/freighter";
 *   test("my test", async ({ page }) => { ... });
 */
import { test as base, expect } from "@playwright/test";

// A valid-looking Stellar public key (G... 56 characters).
export const STUB_PUBLIC_KEY =
  "GTEST000000000000000000000000000000000000000000000STUBKEY";

/** Script injected before each page load to mock the Freighter extension API. */
const FREIGHTER_INIT_SCRIPT = `
  window.freighterApi = {
    requestAccess: () => Promise.resolve({ publicKey: "${STUB_PUBLIC_KEY}" }),
    getPublicKey: () => Promise.resolve("${STUB_PUBLIC_KEY}"),
    signTransaction: (xdr, _opts) => Promise.resolve({ signedXDR: xdr }),
    isConnected: () => Promise.resolve(true),
  };
`;

type FreighterFixtures = {
  /** Page with the Freighter API stub pre-injected. */
  freighterPage: ReturnType<typeof base.extend> extends { page: infer P }
    ? P
    : never;
};

/**
 * Extended Playwright `test` that automatically injects `window.freighterApi`
 * before every page navigation.
 */
export const freighterFixture = base.extend<{ freighterPage: void }>({
  // The fixture overrides the shared `page` fixture by adding an init script.
  // We attach it as a fixture named `freighterPage` so callers can opt in
  // explicitly; using the plain `page` fixture also works after calling
  // `page.addInitScript` manually.
  freighterPage: [
    async ({ page }, use) => {
      await page.addInitScript(FREIGHTER_INIT_SCRIPT);
      await use(page as unknown as void);
    },
    { auto: true },
  ],
});

// Re-export test and expect so consumers only need to import from this file.
export { expect };
export const test = freighterFixture;
