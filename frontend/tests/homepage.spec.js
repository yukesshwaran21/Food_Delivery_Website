
import { test, expect } from '@playwright/test';

test('homepage should load successfully', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toBeEmpty();
});
