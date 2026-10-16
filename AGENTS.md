# Food Delivery Website Agent Guidelines

## Project Overview

This is a MERN food-ordering application with three independently managed apps:

- `frontend/`: React and Vite customer-facing application.
- `admin/`: React and Vite administration panel.
- `backend/`: Express and Node.js API backed by MongoDB.

Keep changes within the relevant app when possible. For API, authentication,
data-model, or shared contract changes, inspect and update all affected
frontend, admin, and backend callers.

## Existing Project Guidance

The repository's detailed rules are already maintained here:

- `.agents/rules/coding-standards.md`
- `.agents/rules/testing-requirements.md`
- `.agents/skills/test-first-development/SKILL.md`
- `.agents/skills/secure-code-change/SKILL.md`

Follow those files for coding style, test-first changes, security-sensitive
work, and completion reporting. Do not weaken tests, lint rules, or security
scans to make a change pass.

## Local Development

Use Node.js 22 to match CI. Install dependencies in each app that you work
on, then start the required services:

```powershell
cd backend
npm install
npm run server
```

```powershell
cd frontend
npm install
npm run dev
```

```powershell
cd admin
npm install
npm run dev -- --port 5174
```

On Windows, `start-dev.bat` starts all three development servers using the
standard ports: backend `4000`, frontend `5173`, and admin `5174`.

Backend configuration belongs in `backend/.env`. Use the variables documented
in `ENV_SETUP.md`, and never commit secrets, tokens, database credentials, or
uploaded user files.

## Validation Commands

Run commands from the directory whose `package.json` defines them:

```powershell
cd frontend
npm run lint
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
```

For a broader frontend regression check:

```powershell
cd frontend
npm run test:regression
```

Run `npm run lint` and `npm run build` in `admin` when changing the admin app.
Run the backend's applicable tests or startup checks when changing backend
behavior; the backend currently exposes `npm run server` and `npm start`
rather than a dedicated test script.

Run the Semgrep scan for security-sensitive changes or when modifying
authentication, authorization, uploads, payments, or API input handling:

```powershell
cd frontend
npm run security:semgrep
```

Do not run Playwright from the repository root. Use the frontend directory so
it loads the intended Vitest and Playwright configurations.

## API Documentation

The generated API inventory is [docs/API.md](docs/API.md). It is derived from
the Express route definitions in `backend/routes/`, so route additions and
changes must be followed by:

```powershell
cd backend
npm run docs:api
npm run docs:api:check
```

CI runs the check command and fails if `docs/API.md` is stale. Keep endpoint
semantics, request/response details, and unusual validation requirements
documented near the relevant route or controller when the generated inventory
does not capture them.

## Change Conventions

- Prefer small, surgical changes that preserve existing behavior.
- Add or update unit, integration, or Playwright tests for changed behavior;
  include invalid-input and error cases where relevant.
- Validate and authorize all untrusted API input, including route parameters,
  query strings, request bodies, and uploaded files.
- Use existing React, Vite, Express, MongoDB, and error-handling patterns
  before introducing new abstractions or dependencies.
- Do not hardcode secrets or expose sensitive data in logs or API responses.
- Keep generated output, dependency directories, local environment files, and
  test artifacts out of source changes unless the task explicitly requires
  them.
- Update `README.md` or `ENV_SETUP.md` when setup, commands, ports, or
  environment variables change.
