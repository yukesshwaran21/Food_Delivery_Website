import { test } from "@applitools/eyes-playwright/fixture";
import { expect } from "@playwright/test";

test("Food Delivery Homepage visual test", async ({ page, eyes }) => {
  await page.goto("/");

  await expect(page.locator("body")).toBeVisible();

  await eyes.check("Food Delivery Homepage", {
    fully: true,
    matchLevel: "Strict",
  });
});
