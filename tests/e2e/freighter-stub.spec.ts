/**
 * Freighter stub fixture smoke test (#603).
 *
 * Verifies that the `freighterFixture` correctly injects `window.freighterApi`
 * so downstream tests can rely on it without a real browser extension.
 */
import { test, expect, STUB_PUBLIC_KEY } from "./fixtures/freighter";

test("window.freighterApi is injected by the fixture", async ({ page }) => {
  await page.goto("/");

  const isDefined = await page.evaluate(() => typeof window.freighterApi !== "undefined");
  expect(isDefined).toBe(true);
});

test("getPublicKey() returns the stub key", async ({ page }) => {
  await page.goto("/");

  const key = await page.evaluate(() =>
    (window as any).freighterApi.getPublicKey()
  );
  expect(key).toBe(STUB_PUBLIC_KEY);
});

test("isConnected() returns true", async ({ page }) => {
  await page.goto("/");

  const connected = await page.evaluate(() =>
    (window as any).freighterApi.isConnected()
  );
  expect(connected).toBe(true);
});
