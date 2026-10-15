# Food Ordering Web App (MERN Stack)

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Contact](#contact)

## Introduction
This is a full-stack food ordering web application built using the MERN stack (MongoDB, Express, React, Node.js). The application consists of a customer-facing app for ordering food and an admin app for managing orders, menu items, and more.

## Features
- User authentication and authorization
- Browse food items
- Add items to the cart and place orders
- Stripe Payment Integration: Secure and reliable payment processing using Stripe.
- Order tracking
- Admin panel to manage menu items, orders

## Technologies Used
- **Frontend:** React.js, React Context API, React Router
- **Backend:** Node.js, Express.js
- **Payment Gateway:** Stripe
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **Styling:** CSS

## Installation
### Prerequisites
- Node.js
- MongoDB

### Clone the Repository
```sh
git clone https://github.com/krishnakumar287/Food_Delivery_Website.git
cd mern-food-delivery-app
```

## Backend Setup
Navigate to the backend directory:

```sh
cd backend

```
Install dependencies:

```sh
npm install
```

Create a .env file in the backend directory and add the following:

```sh
JWT_SECRET="YOUR_JWT_SECRET_HERE"
STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY_HERE"
```

Start the backend server:

```sh
npm run server
```
## Frontend Setup
Navigate to the frontend directory:

```sh

cd frontend
```

Install dependencies:
```sh

npm install
```

Start the frontend server:
```sh

npm run dev
```

## Admin App Setup

Navigate to the admin directory:
```sh

cd admin
```

Install dependencies:

```sh
npm install
```

Start the admin app :
```sh
npm run dev
```

## Testing

Run frontend tests from the `frontend` directory so Vitest and Playwright use
their matching local configurations and dependencies:

```sh
cd frontend

# Unit and integration tests
npm run test:unit
npm run test:integration

# End-to-end tests
npm run test:e2e
```

Do not run `npx playwright test` from the repository root. The root directory
does not contain the frontend test configuration, so Playwright can discover
Vitest component tests and report CSS parsing or duplicate test-runner errors.

## Usage

Access the customer-facing app https://food-delivery-website-3-tq77.onrender.com.
Access the admin app at https://food-delivery-website-3-tq77.onrender.com.

Register as a new user or log in with existing credentials.
Browse the menu, add items to the cart, and place an order.
Pay using dummy visa card
Use the admin panel to manage orders, menu items.

## API Documentation
The API endpoints for the backend can be documented using tools like Postman or Swagger. Include endpoints for user authentication, menu items, orders, and more.

## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes. Make sure to follow the code style and include relevant tests.

The `Conditional LGTM` workflow runs lint, unit, integration, end-to-end, and
build checks on every push. It adds a conditional LGTM comment to the commit
only when all checks pass. Final acceptance still depends on repository review
and branch protection settings.

The AI push-summary workflow applies context hygiene before sending commit
messages and diffs to Ollama. Email addresses, phone numbers, and common
personal fields such as names and addresses are replaced with
`{{PLACEHOLDER}}` values.


## Contact
For any questions or suggestions, feel free to contact me.

Happy coding!

Feel free to customize this template according to your specific project details and requirements.
