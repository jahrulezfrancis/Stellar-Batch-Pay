import { test, expect } from "@playwright/test"

test.describe("App Header Search", () => {
  test("debounces and routes to history page with search query", async ({ page }) => {
    // Go to dashboard
    await page.goto("/dashboard")
    
    // Ensure search input is visible
    const searchInput = page.locator("#dashboard-search")
    await expect(searchInput).toBeVisible()
    
    // Type a query
    const query = "test-job-id"
    await searchInput.fill(query)
    
    // Wait for the debounce and routing to occur
    await page.waitForURL(/\/dashboard\/history\?search=test-job-id/, { timeout: 5000 })
    
    // Assert we landed on the history page with the correct query
    expect(page.url()).toContain("search=test-job-id")
    
    // Search input should now be hidden (replaced by breadcrumbs)
    await expect(searchInput).toBeHidden()
  })
})
