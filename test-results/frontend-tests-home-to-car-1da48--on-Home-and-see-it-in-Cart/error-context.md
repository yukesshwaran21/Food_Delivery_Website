# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend\tests\home-to-cart.spec.js >> user can add a food item on Home and see it in Cart
- Location: frontend\tests\home-to-cart.spec.js:4:1

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1  | 
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test('user can add a food item on Home and see it in Cart', async ({ page }) => {
  5  |   // Open Home page
> 6  |   await page.goto('/');
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  7  | 
  8  |   // Wait for the food API response and displayed dishes
  9  |   await expect(
  10 |     page.locator('.top-dish-wrapper').first()
  11 |   ).toBeVisible({ timeout: 15000 });
  12 | 
  13 |   // Find the first displayed dish
  14 |   const firstDish = page.locator('.top-dish-wrapper').first();
  15 |   const dishName = (await firstDish.locator('p').first().innerText()).trim();
  16 | 
  17 |   // Click its Add icon if the item is not already in the cart.
  18 |   const addIcon = firstDish.locator('img.add');
  19 | 
  20 |   if (await addIcon.isVisible().catch(() => false)) {
  21 |     await addIcon.click();
  22 |   } else {
  23 |     // If already added, use the plus counter instead.
  24 |     await firstDish.locator('img[alt="Add"]').click();
  25 |   }
  26 | 
  27 |   // Confirm the Navbar cart count updates
  28 |   await expect(page.locator('.cart-count')).toHaveText('1');
  29 | 
  30 |   // Navigate to Cart
  31 |   await page.locator('a.cart-icon').click();
  32 | 
  33 |   await expect(page).toHaveURL(/\/cart$/);
  34 | 
  35 |   // Verify the selected food appears in Cart
  36 |   await expect(page.getByText(dishName, { exact: true }).first())
  37 |     .toBeVisible();
  38 | 
  39 |   // Verify the cart contains one item
  40 |   await expect(page.getByRole('heading', { level: 1 }))
  41 |     .toContainText('1 item');
  42 | });
  43 | 
```