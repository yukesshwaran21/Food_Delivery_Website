
import { test, expect } from '@playwright/test';

test('customer can add a food item to the cart', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('img', { name: 'Add' }).first().click();

  const cartLink = page.getByRole('link', { name: /Cart 1/ });
  await expect(cartLink).toBeVisible();

  await cartLink.click();

  await expect(
    page.getByText(/Your Cart \(1 item\)/)
  ).toBeVisible();
});
