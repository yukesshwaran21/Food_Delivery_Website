# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home-to-cart.spec.js >> user can add a food item on Home and see it in Cart
- Location: tests\home-to-cart.spec.js:4:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.cart-item').filter({ hasText: 'Mediterranean Quinoa Salad' }).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.cart-item').filter({ hasText: 'Mediterranean Quinoa Salad' }).first() with timeout 15000ms
  - waiting for locator('.cart-item').filter({ hasText: 'Mediterranean Quinoa Salad' }).first()

```

```yaml
- navigation:
  - link "Food Delivery Logo":
    - /url: /
    - img "Food Delivery Logo"
  - menu:
    - listitem:
      - link "Home":
        - /url: /
    - listitem:
      - link "Menu":
        - /url: "#dishes"
    - listitem:
      - link "Mobile App":
        - /url: "#app-download"
    - listitem:
      - link "Contact Us":
        - /url: "#contact"
  - link "Cart 1":
    - /url: /cart
    - img "Cart"
    - text: "1"
  - button "Sign In"
- heading "Your Cart (1 item)" [level=1]
- paragraph: Review your items and proceed to checkout
- text: Image Product Price Quantity Total Action
- img "Shahi Paneer with Butter Naan"
- text: Shahi Paneer with Butter Naan $190.00
- button "-"
- text: "1"
- button "+"
- text: $190.00
- button "×"
- heading "Order Summary" [level=2]
- text: Subtotal $190.00
- separator
- text: Delivery Fee $2.00
- separator
- text: Total $192.00
- button "PROCEED TO CHECKOUT"
- button "CLEAR CART"
- heading "Have a promo code?" [level=3]
- paragraph: "Try: welcome10, special25, or freeship"
- textbox "Promo code":
  - /placeholder: Enter promo code
- button "Apply"
- contentinfo:
  - link "EatOnWheels home":
    - /url: /
    - img "EatOnWheels"
  - paragraph: Delicious food, delivered to your doorstep.
  - button "Facebook"
  - button "Twitter"
  - button "LinkedIn"
  - heading "Explore" [level=2]
  - list:
    - listitem:
      - link "Home":
        - /url: /
    - listitem:
      - link "Menu":
        - /url: /#dishes
    - listitem:
      - link "Mobile App":
        - /url: /#app-download
    - listitem:
      - link "Contact Us":
        - /url: /#contact
  - heading "Useful Links" [level=2]
  - list:
    - listitem:
      - link "My Orders":
        - /url: /myorders
    - listitem:
      - link "Cart":
        - /url: /cart
  - heading "Get in Touch" [level=2]
  - list:
    - listitem:
      - text: Phone
      - link "+91 1234567890":
        - /url: tel:+911234567890
    - listitem:
      - text: Email
      - link "eatonwheels@gmail.com":
        - /url: mailto:eatonwheels@gmail.com
  - paragraph: © 2026 EatOnWheels. All rights reserved.
```

# Test source

```ts
  1  | 
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test('user can add a food item on Home and see it in Cart', async ({ page }) => {
  5  |   await page.goto('/');
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
  22 |   await expect(
  23 |     page.locator('.cart-item').filter({ hasText: dishName }).first()
> 24 |   ).toBeVisible({ timeout: 15000 });
     |     ^ Error: expect(locator).toBeVisible() failed
  25 | });
  26 | 
```