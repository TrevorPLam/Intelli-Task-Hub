# End-to-End Testing with Playwright

This directory contains E2E tests using Playwright.

## Running Tests

```bash
# Run all tests
pnpm exec playwright test

# Run tests in headed mode (see browser)
pnpm exec playwright test --headed

# Run tests on specific browser
pnpm exec playwright test --project=chromium

# Run tests with UI mode
pnpm exec playwright test --ui

# Run tests in debug mode
pnpm exec playwright test --debug
```

## Generating Tests

Use CodeGen to generate tests by recording your actions:

```bash
pnpm exec playwright codegen http://localhost:3000
```

## Viewing Reports

```bash
pnpm exec playwright show-report
```

## Best Practices

1. Use web-first assertions (`toBeVisible()`, `toHaveText()`) rather than manual waits
2. Prefer user-facing locators (text, role, label) over CSS selectors
3. Use `test.describe` to group related tests
4. Use fixtures for shared setup
