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

Locator: locator('.top-dish-wrapper').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.top-dish-wrapper').first() with timeout 15000ms
  - waiting for locator('.top-dish-wrapper').first()

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
  - link "Cart":
    - /url: /cart
    - img "Cart"
  - button "Sign In"
- progressbar
- heading "Fresh Food Delivered to Your Doorstep" [level=1]
- paragraph: Enjoy the best selection of local restaurants delivered fast and fresh. Order your favorites and discover new tastes right from the comfort of your home.
- button "Explore Menu":
  - text: Explore Menu
  - img
- textbox "Email for promotions":
  - /placeholder: Email for exclusive deals
- button "Get Deals"
- img "Delicious food"
- text: 🔥 30%OFF
- heading "Top Dishes Near You" [level=2]
- paragraph: Discover the most loved dishes in your neighborhood, fresh and ready to be delivered
- tablist "Food categories":
  - tab "All" [selected]
  - tab "Salad"
  - tab "Rolls"
  - tab "Deserts"
  - tab "Sandwich"
  - tab "Cake"
  - tab "Pure Veg"
  - tab "Pasta"
  - tab "Noodles"
- paragraph: Error loading dishes
- button "Try Again"
- heading "What Our Customers Say" [level=2]
- paragraph: Don't just take our word for it, hear from our satisfied customers
- text: "\""
- img "Emma Thompson"
- text: ★ ★ ★ ★ ★
- paragraph: "\"The food delivery service is absolutely incredible! The food always arrives hot and fresh, and the delivery is consistently on time. I can't imagine ordering from anywhere else now.\""
- paragraph: Emma Thompson
- text: "\""
- img "Michael Chen"
- text: ★ ★ ★ ★ ★
- paragraph: "\"I've tried many food delivery services, but this one stands out for its exceptional quality and service. The app is so user-friendly, and the variety of restaurants is impressive!\""
- paragraph: Michael Chen
- text: "\""
- img "Sarah Johnson"
- text: ★ ★ ★ ★ ★
- paragraph: "\"Great selection of restaurants and super reliable delivery. The only reason I'm giving 4 stars instead of 5 is that I wish they had more vegan options, but otherwise perfect!\""
- paragraph: Sarah Johnson
- button "View testimonial 1"
- button "View testimonial 2"
- button "View testimonial 3"
- text: OUR BENEFITS
- heading "Why Choose Us" [level=2]
- paragraph: Discover why thousands of food lovers trust us for their daily meals
- img
- heading "Lightning Fast Delivery" [level=3]
- paragraph: Our optimized delivery network ensures your food arrives hot and fresh in 30 minutes or less.
- text: 30 min
- img
- heading "Customer Satisfaction" [level=3]
- paragraph: Join our community of satisfied customers who love our diverse menu and exceptional service.
- text: 98 %
- img
- heading "Best Value Pricing" [level=3]
- paragraph: Enjoy premium quality food at competitive prices with exclusive deals and promotions.
- text: 20 % off
- img
- heading "24/7 Customer Support" [level=3]
- paragraph: Our dedicated team is always available to assist you with any questions or special requests.
- text: 24 /7
- button "Explore Our Menu":
  - text: Explore Our Menu
  - img
- heading "Subscribe to Our Newsletter" [level=2]
- paragraph: Get the latest deals, recipes and food trends delivered to your inbox
- textbox "Email address":
  - /placeholder: Your email address
- button "Subscribe"
- paragraph: By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
- heading "Get the Mobile App" [level=2]
- paragraph: Download our app for a faster, more convenient experience
- img "Download on Google Play"
- img "Download on App Store"
- paragraph: We are here to help
- heading "Contact Us" [level=2]
- paragraph: Have a question about your order or want to share feedback? Send us a message and our team will get back to you.
- text: Full Name
- textbox "Full Name"
- text: Email Address
- textbox "Email Address"
- text: Phone Number
- textbox "Phone Number"
- text: Subject
- textbox "Subject"
- text: Message
- textbox "Message"
- text: Attachment (optional) Choose File
- button "Attachment (optional) Choose File"
- text: No file selected PDF, JPG, PNG, DOC, DOCX. Maximum 5 MB.
- button "Send Message"
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
> 8  |   await expect(firstDish).toBeVisible({ timeout: 15000 });
     |                           ^ Error: expect(locator).toBeVisible() failed
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