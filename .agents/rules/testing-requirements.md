
---
trigger: always_on
description: Testing requirements for every code change in the Food Delivery Website.
---

# Testing Requirements

1. Every new feature must include appropriate automated tests.
2. Every bug fix must include a regression test that reproduces the bug.
3. For changed logic, add or update unit tests.
4. For interactions between components, context, or API modules, add or update integration tests.
5. For important customer workflows, add or update Playwright E2E tests.
6. When modifying existing behavior, identify affected features and run relevant regression tests.
7. Never delete or weaken an existing test simply to make it pass.
8. Never claim a test passed unless it was actually executed successfully.
9. If tests cannot run, explain the blocker and report the tests that remain unverified.
10. Before completing a task, run the relevant tests, lint, and build where possible.
11. Include negative cases and edge cases, not only the successful path.
12. Summarize which tests were added, modified, and executed.
