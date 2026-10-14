import { test, expect } from "@playwright/test";

test.describe("User Login Feature", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "captchaVerifiedUntil",
        String(Date.now() + 60 * 60 * 1000)
      );
    });

    await page.route("**/api/user/login", async (route) => {
      const request = route.request().postDataJSON();
      const isValidLogin =
        request.email === "test-user@example.com" &&
        request.password === "ValidPassword123!";

      if (isValidLogin) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, token: "e2e-test-token" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Invalid email or password",
        }),
      });
    });

    await page.goto("/login");
    await page.locator("#terms").check();
  });

  test("Login interface provides required elements", async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /login|sign in|submit/i })).toBeVisible();
  });

  test("Successful login with valid credentials", async ({ page }) => {
    // TODO: Provide valid test environment credentials
    await page.getByLabel(/email/i).fill("test-user@example.com");
    await page.getByLabel(/password/i).fill("ValidPassword123!");
    
    await page.getByRole("button", { name: /login|sign in|submit/i }).click();

    // TODO: Update expected post-login URL or dashboard element selector
    await expect(page).toHaveURL(/dashboard|home|\/$/);
  });

  test("Failed login with incorrect password", async ({ page }) => {
    await page.getByLabel(/email/i).fill("test-user@example.com");
    await page.getByLabel(/password/i).fill("WrongPassword123!");
    
    await page.getByRole("button", { name: /login|sign in|submit/i }).click();

    // TODO: Verify actual error message selector and text
    await expect(page.getByText(/invalid email or password|error/i)).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test("Failed login with unregistered email", async ({ page }) => {
    await page.getByLabel(/email/i).fill("nonexistent-user@example.com");
    await page.getByLabel(/password/i).fill("SomePassword123!");
    
    await page.getByRole("button", { name: /login|sign in|submit/i }).click();

    // TODO: Verify generic error message to prevent account enumeration
    await expect(page.getByText(/invalid email or password|error/i)).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test("Required field validation when both fields are empty", async ({ page }) => {
    await page.getByRole("button", { name: /login|sign in|submit/i }).click();

    // TODO: Verify browser native validation or inline error messages for empty fields
    await expect(page.getByLabel(/email/i)).toHaveAttribute("required", "");
    await expect(page.getByLabel(/password/i)).toHaveAttribute("required", "");
  });

  test("Validation when email field is empty", async ({ page }) => {
    await page.getByLabel(/password/i).fill("ValidPassword123!");
    await page.getByRole("button", { name: /login|sign in|submit/i }).click();

    // TODO: Assert appropriate validation behavior for missing email
    await expect(page).toHaveURL(/login/);
  });

  test("Validation when password field is empty", async ({ page }) => {
    await page.getByLabel(/email/i).fill("test-user@example.com");
    await page.getByRole("button", { name: /login|sign in|submit/i }).click();

    // TODO: Assert appropriate validation behavior for missing password
    await expect(page).toHaveURL(/login/);
  });

  test("Invalid email format rejection", async ({ page }) => {
    await page.getByLabel(/email/i).fill("invalid-email-format");
    await page.getByLabel(/password/i).fill("ValidPassword123!");
    await page.getByRole("button", { name: /login|sign in|submit/i }).click();

    // TODO: Verify client-side or server-side email validation message
    await expect(page.getByLabel(/email/i)).toHaveAttribute("type", "email");
  });

  test("Password field conceals password by default", async ({ page }) => {
    const passwordField = page.getByLabel(/password/i);
    await expect(passwordField).toHaveAttribute("type", "password");
  });

  test("User can recover and correct credentials after a failed attempt", async ({ page }) => {
    // First failed attempt
    await page.getByLabel(/email/i).fill("test-user@example.com");
    await page.getByLabel(/password/i).fill("WrongPassword123!");
    await page.getByRole("button", { name: /login|sign in|submit/i }).click();

    await expect(page.getByText(/invalid email or password|error/i)).toBeVisible();

    // Correcting credentials and trying again
    await page.getByLabel(/password/i).clear();
    await page.getByLabel(/password/i).fill("ValidPassword123!");
    await page.getByRole("button", { name: /login|sign in|submit/i }).click();

    // TODO: Confirm successful redirection after correction
    await expect(page).toHaveURL(/dashboard|home|\/$/);
  });
});