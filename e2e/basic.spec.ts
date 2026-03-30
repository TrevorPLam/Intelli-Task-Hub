import { test, expect } from "@playwright/test";

test("homepage has title and links", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Intelli-Task-Hub/);
});

test("api health check", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
});

test("chat flow - create conversation", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Intelli-Task-Hub/);

  // Create new conversation
  await page.click('[data-testid="new-conversation-btn"]');
  await page.fill('[data-testid="conversation-title"]', "Test Conversation");
  await page.click('[data-testid="create-conversation"]');

  // Verify conversation created
  await expect(page.locator('[data-testid="conversation-item"]')).toContainText(
    "Test Conversation"
  );
});

test("chat flow - send message", async ({ page }) => {
  await page.goto("/");

  // Create and enter conversation
  await page.click('[data-testid="new-conversation-btn"]');
  await page.fill('[data-testid="conversation-title"]', "Message Test");
  await page.click('[data-testid="create-conversation"]');

  // Send a message
  await page.fill(
    '[data-testid="message-input"]',
    "Hello, this is a test message"
  );
  await page.click('[data-testid="send-message"]');

  // Verify message appears
  await expect(page.locator('[data-testid="message-content"]')).toContainText(
    "Hello, this is a test message"
  );
});

test("conversation management - delete conversation", async ({ page }) => {
  await page.goto("/");

  // Create conversation
  await page.click('[data-testid="new-conversation-btn"]');
  await page.fill('[data-testid="conversation-title"]', "Delete Test");
  await page.click('[data-testid="create-conversation"]');

  // Delete conversation
  await page.click('[data-testid="conversation-menu"]');
  await page.click('[data-testid="delete-conversation"]');
  await page.click('[data-testid="confirm-delete"]');

  // Verify conversation deleted
  await expect(
    page.locator('[data-testid="conversation-item"]')
  ).not.toContainText("Delete Test");
});

test("error handling - network failure", async ({ page }) => {
  // Mock network failure
  await page.route("**/api/**", (route) => route.abort());

  await page.goto("/");
  await page.click('[data-testid="new-conversation-btn"]');
  await page.click('[data-testid="create-conversation"]');

  // Verify error message
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
});
