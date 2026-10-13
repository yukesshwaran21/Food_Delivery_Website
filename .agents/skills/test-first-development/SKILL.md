
---
name: test-first-development
description: Implements features and bug fixes with appropriate unit, integration, E2E, and regression tests for the Food Delivery Website.
---

# Test-First Development Skill

## When to use

Use this skill whenever adding a feature, changing existing behavior, or fixing a bug.

## Procedure

### Step 1: Understand the change
- Read the relevant components, API routes, controllers, and context.
- Identify existing behavior that must remain unchanged.
- Identify affected features and edge cases.

### Step 2: Plan the tests
Choose the appropriate test levels:
- Unit: individual functions and components.
- Integration: cooperating components, context, or API modules.
- E2E: important customer workflows in a browser.
- Regression: existing tests affected by the change.

### Step 3: Write or update tests
- For a bug, first create a test that reproduces the bug.
- For a feature, define expected behavior before implementing it.
- Cover success cases, invalid input, boundary values, and error handling where relevant.
- Reuse the project's existing Vitest and Playwright setup.

### Step 4: Implement the smallest safe change
- Avoid unrelated refactoring.
- Preserve existing public behavior unless requirements say otherwise.
- Do not weaken assertions or skip failing tests to obtain a passing result.

### Step 5: Verify
Run the relevant commands from the frontend directory:
- npm run test:unit
- npm run test:integration
- npm run test:e2e
- npm run lint
- npm run build

Run the relevant backend tests too when backend behavior changes.

### Step 6: Report
Summarize:
- What changed.
- Tests added or updated.
- Commands executed and actual results.
- Known failures or unverified behavior.

Never report a test as passing if it was not executed successfully.

