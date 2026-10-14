import { test, expect } from "./fixtures.js";
// Assumptions:
// 1. Food items can be added from a menu page using an "Add to Cart" or similar role/button.
// 2. The cart can be viewed or is visible on the page (e.g., side cart or cart page).
// 3. Cart items have quantity controls (e.g., increase/decrease buttons or inputs) and remove buttons.
// 4. Prices and totals are displayed as text elements.

test.describe("Shopping Cart", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should add a food item to the cart and update quantity and total price", async ({ page }) => {
    const foodItemCard = page.locator(".top-dish-wrapper").first();
    await expect(foodItemCard).toBeVisible({ timeout: 15000 });
    const itemName = (await foodItemCard.locator(".top-dish-name-rating p").innerText()).trim();
    const itemPriceText = (await foodItemCard.locator(".top-dish-price").innerText()).trim();

    await foodItemCard.locator("img.add-icon").click();
    await page.locator("a.cart-icon").click({ force: true });

    const cartItem = page.locator(".cart-item").filter({ hasText: itemName }).first();
    await expect(cartItem).toBeVisible();
    await expect(cartItem.locator(".quantity-display").first()).toHaveText("1");
    await expect(cartItem.locator(".cart-item-total").first()).toHaveText(itemPriceText);
  });

  test("should update total price when increasing item quantity", async ({ page }) => {
    const foodItemCard = page.locator(".top-dish-wrapper").first();
    await expect(foodItemCard).toBeVisible({ timeout: 15000 });
    await foodItemCard.locator("img.add-icon").click();
    await page.locator("a.cart-icon").click({ force: true });

    const cartItem = page.locator(".cart-item-desktop").first();
    const initialTotal = await cartItem.locator(".cart-item-total").innerText();
    await cartItem.locator(".quantity-btn").nth(1).click({ force: true });

    await expect(cartItem.locator(".quantity-display")).toHaveText("2");
    await expect(cartItem.locator(".cart-item-total")).not.toHaveText(initialTotal);
  });

  test("should remove an item from the cart", async ({ page }) => {
    const foodItemCard = page.locator(".top-dish-wrapper").first();
    await expect(foodItemCard).toBeVisible({ timeout: 15000 });
    await foodItemCard.locator("img.add-icon").click();
    await page.locator("a.cart-icon").click({ force: true });

    const cartItem = page.locator(".cart-item-desktop").first();
    await expect(cartItem).toBeVisible();
    await cartItem.locator(".remove-btn").click({ force: true });

    await expect(page.locator(".empty-cart")).toBeVisible();
  });

  test("negative/boundary: cart should not display incorrect total when quantity changes rapidly or reaches zero", async ({ page }) => {
    const foodItemCard = page.locator(".top-dish-wrapper").first();
    await expect(foodItemCard).toBeVisible({ timeout: 15000 });
    await foodItemCard.locator("img.add-icon").click();
    await page.locator("a.cart-icon").click({ force: true });

    const cartItem = page.locator(".cart-item-desktop").first();
    const increaseButton = cartItem.locator(".quantity-btn").nth(1);
    const decreaseButton = cartItem.locator(".quantity-btn").first();

    // Increase and decrease rapidly to test state consistency
    await increaseButton.click({ force: true });
    await increaseButton.click({ force: true });
    await decreaseButton.click({ force: true });

    // Quantity should stabilize at 2
    await expect(cartItem.locator(".quantity-display")).toHaveText("2");

    // Decrease down to boundary (1)
    await decreaseButton.click({ force: true });
    await expect(cartItem.locator(".quantity-display")).toHaveText("1");

    // Ensure total is valid and doesn't show NaN, negative numbers, or stale values
    const cartTotal = page.locator(".summary-total .total-amount");
    await expect(cartTotal).toHaveText(/^\$\d+\.\d{2}$/);
    await expect(cartTotal).not.toHaveText(/NaN/i);
  });
});