
---
name: secure-code-change
description: Reviews and implements security-sensitive changes involving Express APIs, authentication, authorization, file uploads, dependencies, and MongoDB operations.
---

# Secure Code Change Skill

## Procedure

1. Identify user-controlled input and trust boundaries.
2. Validate request bodies, query parameters, route parameters, and uploaded files.
3. Check authentication and authorization for protected operations.
4. Use safe database operations and avoid injection-prone query construction.
5. Prevent path traversal when creating, reading, or deleting files.
6. Never expose secrets, password hashes, tokens, or sensitive user data in logs or API responses.
7. Handle errors without exposing internal stack traces to clients.
8. Review dependency changes for known vulnerabilities.
9. Add tests for invalid input, unauthorized access, and relevant security edge cases.
10. Run applicable lint, unit, integration, and security scans.
11. Explain unresolved findings; do not suppress scanner results without justification.

## Completion report

State:
- The security-sensitive code paths reviewed.
- The validations and protections added.
- Tests and security scans executed.
- Remaining risks and unresolved findings.
