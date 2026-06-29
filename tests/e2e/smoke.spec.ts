/**
 * Smoke e2e (#363, #604).
 *
 * The first job from the issue's acceptance criteria: home page
 * loads, dashboard is reachable. Keeps the bar low enough that any
 * regression introducing a build/runtime crash is caught before
 * merge while the heavier upload → build → sign → results flow
 * is iterated in `happy-path.spec.ts`.
 *
 * #604 adds visible UI landmark assertions so a blank/broken render
 * is caught even when the HTTP status is 200.
 */
import { test, expect } from "@playwright/test";

test("home page renders without crashing", async ({ page }) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(500);
});

test("dashboard route responds", async ({ page }) => {
  const response = await page.goto("/dashboard");
  expect(response).not.toBeNull();
  // Even an auth-protected route should return < 500; auth
  // redirects (3xx) and intentional 401/403 are fine.
  expect(response!.status()).toBeLessThan(500);
});

// ── #604: UI landmark assertions ───────────────────────────────────────────

test("home page has a heading and navigation", async ({ page }) => {
  await page.goto("/");

  // The Hero renders an h1 with the main value proposition.
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();

  // The Navbar is a <nav> element at the top of the page.
  const nav = page.getByRole("navigation");
  await expect(nav.first()).toBeVisible();
});

test("home page has a visible call-to-action link to start a batch", async ({ page }) => {
  await page.goto("/");

  // Hero renders a "Start Batch Payment" link (rendered as <a> via Button asChild).
  // Match by accessible name (link text) to stay selector-free.
  const cta = page.getByRole("link", { name: /start batch payment/i });
  await expect(cta).toBeVisible();
});

test("dashboard page has sidebar navigation with Batch History link", async ({ page }) => {
  await page.goto("/dashboard");

  // The DashboardLayout wraps content in an AppSidebar which renders
  // nav items as links. "Batch History" is always in the sidebar regardless
  // of wallet connection state.
  const batchHistoryLink = page.getByRole("link", { name: /batch history/i });
  await expect(batchHistoryLink).toBeVisible();
});

test("dashboard page sidebar contains nav links", async ({ page }) => {
  await page.goto("/dashboard");

  // Sidebar contains a link back to the dashboard root ("Dashboard" label).
  const dashboardLink = page.getByRole("link", { name: /^dashboard$/i });
  await expect(dashboardLink.first()).toBeVisible();

  // "New Batch Payment" nav item should also be present.
  const newBatchLink = page.getByRole("link", { name: /new batch payment/i });
  await expect(newBatchLink).toBeVisible();
});
