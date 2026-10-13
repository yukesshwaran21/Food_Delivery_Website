
---
trigger: always_on
description: Mandatory coding and architecture rules for the Food Delivery Website.
---

# Coding Standards

1. Follow the existing project architecture and naming conventions.
2. Do not rewrite unrelated files when implementing a feature.
3. Use the existing React, Vite, Express, and MongoDB patterns unless a change is justified.
4. Validate and sanitize untrusted input at API boundaries.
5. Never hardcode secrets, passwords, API keys, or database credentials.
6. Never store user passwords in plain text.
7. Handle API errors explicitly; do not silently ignore failures.
8. Do not disable ESLint rules or security checks just to make a build pass.
9. Do not add dependencies without explaining why they are needed.
10. Preserve existing functionality unless the requirement explicitly changes it.
11. For database or API changes, check affected frontend, backend, and admin code.
12. Before finishing, report changed files, risks, and verification results.
