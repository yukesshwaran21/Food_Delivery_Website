# API Documentation

This endpoint inventory is generated from the Express route definitions in
`backend/routes/`. Do not edit the endpoint table manually.

## Base URL

- Local development: `http://localhost:4000`
- Production: configure the deployed backend URL for the environment.

## Authentication

Authenticated endpoints expect the JWT in the `token` request header. The
backend's `authMiddleware` validates this token and provides the authenticated
user ID to the controller.

## Endpoints

| Method | Path | Authentication | File upload | Route definition |
| --- | --- | --- | --- | --- |
| `POST` | `/api/cart/add` | Required | No | `backend/routes/cartRoute.js` |
| `POST` | `/api/cart/get` | Required | No | `backend/routes/cartRoute.js` |
| `POST` | `/api/cart/remove` | Required | No | `backend/routes/cartRoute.js` |
| `POST` | `/api/contact/submit` | Not indicated | Yes | `backend/routes/contactRoute.js` |
| `POST` | `/api/food/add` | Not indicated | Yes | `backend/routes/foodRoute.js` |
| `GET` | `/api/food/list` | Not indicated | No | `backend/routes/foodRoute.js` |
| `POST` | `/api/food/remove` | Not indicated | No | `backend/routes/foodRoute.js` |
| `DELETE` | `/api/notification/:id` | Not indicated | No | `backend/routes/notificationRoute.js` |
| `POST` | `/api/notification/:id/read` | Not indicated | No | `backend/routes/notificationRoute.js` |
| `DELETE` | `/api/notification/clear-all` | Not indicated | No | `backend/routes/notificationRoute.js` |
| `GET` | `/api/notification/list` | Not indicated | No | `backend/routes/notificationRoute.js` |
| `POST` | `/api/notification/read-all` | Not indicated | No | `backend/routes/notificationRoute.js` |
| `GET` | `/api/notification/unread-count` | Not indicated | No | `backend/routes/notificationRoute.js` |
| `GET` | `/api/order/list` | Not indicated | No | `backend/routes/orderRoute.js` |
| `POST` | `/api/order/place` | Required | No | `backend/routes/orderRoute.js` |
| `POST` | `/api/order/status` | Not indicated | No | `backend/routes/orderRoute.js` |
| `POST` | `/api/order/userorders` | Required | No | `backend/routes/orderRoute.js` |
| `POST` | `/api/order/verify` | Required | No | `backend/routes/orderRoute.js` |
| `GET` | `/api/report/summary` | Not indicated | No | `backend/routes/reportRoute.js` |
| `POST` | `/api/user/google-login` | Not indicated | No | `backend/routes/userRoute.js` |
| `POST` | `/api/user/login` | Not indicated | No | `backend/routes/userRoute.js` |
| `POST` | `/api/user/register` | Not indicated | No | `backend/routes/userRoute.js` |

## Keeping this documentation current

When adding or changing an Express route:

1. Update the route file in `backend/routes/`.
2. Run `npm run docs:api` from `backend/`.
3. Review the generated table and commit `docs/API.md`.

CI runs `npm run docs:api:check` and fails when this file is out of date.
