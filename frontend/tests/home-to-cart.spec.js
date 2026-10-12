
import { test, expect } from '@playwright/test';

test('user can add a food item on Home and see it in Cart', async ({ page }) => {
  await page.goto('/');

  const firstDish = page.locator('.top-dish-wrapper').first();
  await expect(firstDish).toBeVisible({ timeout: 15000 });

  const dishName = (await firstDish.locator('p').first().innerText()).trim();

  const addButton = firstDish.locator('img.add, img.add-icon').first();
  await expect(addButton).toBeVisible();
  await addButton.click();

  await expect(page.locator('.cart-count')).toHaveText('1', {
    timeout: 10000,
  });

  await page.locator('a.cart-icon').click();
  await expect(page).toHaveURL(/\/cart\/?$/);
  await expect(page.getByText(dishName, { exact: true }).first()).toBeVisible();
});
