import { test, expect } from "@playwright/test";

test("homepage has title and links", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Intelli-Task-Hub/);
});

test("api health check", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
});
