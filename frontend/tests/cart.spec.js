
import { test, expect } from '@playwright/test';

test('customer can add a food item to the cart', async ({ page }) => {
  await page.goto('/');

  const firstDish = page.locator('.top-dish-wrapper').first();
  await expect(firstDish).toBeVisible({ timeout: 15000 });

  const addButton = firstDish.locator('img.add, img.add-icon').first();
  await expect(addButton).toBeVisible();
  await addButton.click();

  const cartLink = page.locator('a.cart-icon');
  await expect(cartLink).toBeVisible();
  await expect(cartLink).toHaveClass(/has-items/);

  await cartLink.click({ timeout: 10000 });

  await expect(page).toHaveURL(/\/cart\/?$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Your Cart/i);
});
