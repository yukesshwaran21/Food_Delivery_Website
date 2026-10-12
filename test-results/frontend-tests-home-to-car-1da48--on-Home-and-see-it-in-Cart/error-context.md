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
> 5  |   await page.goto('/');
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  6  | 
  7  |   const firstDish = page.locator('.top-dish-wrapper').first();
  8  |   await expect(firstDish).toBeVisible({ timeout: 15000 });
  9  | 
  10 |   const dishName = (await firstDish.locator('p').first().innerText()).trim();
  11 | 
  12 |   const addButton = firstDish.locator('img.add, img.add-icon').first();
  13 |   await expect(addButton).toBeVisible();
  14 |   await addButton.click();
  15 | 
  16 |   await expect(page.locator('.cart-count')).toHaveText('1', {
  17 |     timeout: 10000,
  18 |   });
  19 | 
  20 |   await page.locator('a.cart-icon').click();
  21 |   await expect(page).toHaveURL(/\/cart\/?$/);
  22 |   await expect(page.getByText(dishName, { exact: true }).first()).toBeVisible();
  23 | });
  24 | 
```