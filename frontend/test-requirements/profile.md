# Feature: Authenticated User Profile Menu

## Objective
Verify that an authenticated user can open and use the profile menu in the
navigation bar, access the orders page, and log out safely.

The current application exposes a profile dropdown rather than a standalone
profile-edit page. Do not invent profile fields, profile update controls, or a
profile route that are not present in the application.

## Preconditions

- Use a dedicated authenticated test account configured for the test
  environment.
- Do not use real user credentials or production accounts.
- Establish authentication using the application's existing login flow or the
  test suite's supported authentication setup.
- If the test environment cannot provide an authenticated account, add a TODO
  and do not hardcode credentials.

## Functional Requirements

1. **Profile control visibility**
   - An authenticated user should see the profile control in the navigation
     bar.
   - The profile control should expose an accessible name or image alternative
     text that identifies it as the profile control.
   - An unauthenticated user should see the existing sign-in control instead of
     the authenticated profile menu.

2. **Open and close the profile menu**
   - Activating the profile control should open the profile dropdown.
   - The opened dropdown should expose the existing `My Orders` and `Logout`
     actions.
   - Activating the profile control again should close the dropdown when that
     behavior is supported by the current implementation.
   - Clicking outside the dropdown should close it.
   - Keyboard activation with Enter or Space should open and close the menu
     where supported by the current implementation.

3. **My Orders navigation**
   - Selecting `My Orders` from the profile dropdown should navigate to the
     application's existing `/myorders` route.
   - The orders page should render its observable page content or loading/empty
     state without an application crash.
   - The profile dropdown should close after navigation.

4. **Logout**
   - Selecting `Logout` should clear the authenticated session according to the
     application's existing behavior.
   - The user should be navigated to the existing home route after logout.
   - After logout, the navigation bar should show the sign-in control rather
     than the authenticated profile control.
   - A logged-out user should not be able to access authenticated order content
     without signing in again, according to the application's existing route
     protection behavior.

5. **Standalone profile page**
   - TODO: There is currently no verified standalone profile page or profile
     editing route in the available application code.
   - Do not generate tests for editing a name, email, phone number, address,
     password, avatar, or other profile fields unless those controls and their
     route are added to the application.

## Test Case Generation Instructions

Generate independent Playwright tests covering:

- Authenticated and unauthenticated profile-control states
- Opening and closing the profile dropdown
- Outside-click and keyboard behavior where supported
- Navigation to the existing `My Orders` page
- Logout and the resulting observable navigation/authentication state
- Error, loading, or empty states visible on the orders page where applicable

Use the application's actual routes, accessible names, selectors, and
authentication behavior. Inspect the relevant source code when available.
Do not invent selectors, routes, credentials, response bodies, profile fields,
or error messages. If implementation details cannot be verified, use a TODO
comment rather than making an assumption.

Use accessible Playwright locators such as `getByRole()`, `getByLabel()`, and
`getByAltText()` where supported by the actual application. Assert observable
UI behavior and URL changes rather than React state, CSS class names, or
implementation details.

Each test must be independent and must not depend on the order in which other
tests run. Do not expose credentials, tokens, or personal data in generated
tests.
