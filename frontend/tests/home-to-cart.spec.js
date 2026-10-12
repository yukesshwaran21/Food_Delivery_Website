
import { test, expect } from '@playwright/test';

test('user can add a food item on Home and see it in Cart', async ({ page }) => {
  // Open Home page
  await page.goto('/');

  // Wait for the food API response and displayed dishes
  await expect(
    page.locator('.top-dish-wrapper').first()
  ).toBeVisible({ timeout: 15000 });

  // Find the first displayed dish
  const firstDish = page.locator('.top-dish-wrapper').first();
  const dishName = (await firstDish.locator('p').first().innerText()).trim();

  // Click its Add icon if the item is not already in the cart.
  const addIcon = firstDish.locator('img.add');

  if (await addIcon.isVisible().catch(() => false)) {
    await addIcon.click();
  } else {
    // If already added, use the plus counter instead.
    await firstDish.locator('img[alt="Add"]').click();
  }

  // Confirm the Navbar cart count updates
  await expect(page.locator('.cart-count')).toHaveText('1');

  // Navigate to Cart
  await page.locator('a.cart-icon').click();

  await expect(page).toHaveURL(/\/cart$/);

  // Verify the selected food appears in Cart
  await expect(page.getByText(dishName, { exact: true }).first())
    .toBeVisible();

  // Verify the cart contains one item
  await expect(page.getByRole('heading', { level: 1 }))
    .toContainText('1 item');
});
