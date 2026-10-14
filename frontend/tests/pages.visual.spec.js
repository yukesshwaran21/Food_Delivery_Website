
import { test } from "@applitools/eyes-playwright/fixture";
import { expect } from "@playwright/test";

test.describe("Food Delivery Visual Regression", () => {
  test("Food listing visual test", async ({ page, eyes }) => {
    await page.goto("/");

    await expect(page.locator("body")).toBeVisible();

    // Capture the homepage, including the food listing.
    await eyes.check("Food Listing", {
      fully: true,
      matchLevel: "Strict",
    });
  });

  test("Cart page visual test", async ({ page, eyes }) => {
    await page.goto("/cart");

    await expect(page.locator("body")).toBeVisible();

    await eyes.check("Cart Page", {
      fully: true,
      matchLevel: "Strict",
    });
  });

  test("Checkout page visual test", async ({ page, eyes }) => {
    await page.goto("/order");

    await expect(page.locator("body")).toBeVisible();

    await eyes.check("Checkout Page", {
      fully: true,
      matchLevel: "Strict",
    });
  });
});
