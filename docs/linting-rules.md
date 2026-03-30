# Linting Rules Documentation

## Overview

This document explains the linting rules and exceptions configured for Intelli-Task-Hub, following 2026 best practices for code quality enforcement.

## ESLint Configuration

### Base Rules

All packages inherit from the base ESLint configuration with these core principles:

- **Code Quality**: Catch bugs and enforce patterns
- **Consistency**: Maintain uniform style across the codebase
- **Type Safety**: Leverage TypeScript for better code quality
- **Performance**: Avoid anti-patterns that impact performance

### Package-Specific Configurations

#### API Server (`artifacts/api-server/`)
- **Additional Rules**:
  - `no-process-exit`: Prevents direct process exits in server code
  - `@typescript-eslint/no-floating-promises`: Ensures proper async/await handling
  - `prefer-const`: Enforces const usage where appropriate

- **Rationale**: Server code requires robust error handling and proper async patterns.

#### React Native (`artifacts/mobile/`)
- **Additional Rules**:
  - `react-native/no-unused-styles`: Prevents unused style definitions
  - `react-native/no-inline-styles`: Warns against inline styles (use StyleSheet instead)
  - `@typescript-eslint/no-non-null-assertion`: Ensures proper null checking

- **Rationale**: Mobile performance requires proper style usage and null safety.

#### Database Library (`lib/db/`)
- **Additional Rules**:
  - `@typescript-eslint/prefer-nullish-coalescing`: Encourages nullish coalescing
  - `@typescript-eslint/no-unnecessary-type-assertion`: Prevents redundant type checks
  - `no-var`: Enforces let/const over var

- **Rationale**: Database code benefits from null safety and modern JavaScript features.

## Prettier Configuration

### Formatting Standards

Prettier enforces consistent code formatting with these rules:

```json
{
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Ignore Patterns

Files and patterns excluded from formatting:

- **Dependencies**: `node_modules/`, lock files
- **Build Artifacts**: `dist/`, `build/`, `coverage/`
- **Generated Files**: `*.config.js`, `*.d.ts`, `generated/`
- **Environment Files**: `.env*`, `.vscode/`
- **Documentation**: `*.md` (technical docs often need manual formatting)
- **Test Artifacts**: `coverage/`, `test-results/`

## Rule Exceptions

### ESLint Exceptions

#### `react/react-in-jsx-scope: "off"`
- **Reason**: React scope is handled by ESLint's automatic detection
- **Impact**: No false positives for React components
- **Alternative**: Use explicit React imports when needed

#### `react/prop-types: "off"`
- **Reason**: TypeScript provides compile-time type checking
- **Impact**: Redundant prop-type definitions
- **Alternative**: Rely on TypeScript interfaces

#### `react/jsx-uses-react: "off"`
- **Reason**: JSX transform automatically handles React import
- **Impact**: Unnecessary import statements
- **Alternative**: Trust the build system's React integration

#### `@typescript-eslint/no-explicit-any: "warn"`
- **Reason**: Legacy code may temporarily use `any`
- **Impact**: Gradual migration path needed
- **Plan**: Replace with proper types as code is refactored

#### `no-console: "warn"`
- **Reason**: Development console logs useful, production should be error-free
- **Impact**: Controlled logging during development
- **Plan**: Use proper logging library for production

## CI/CD Integration

### Pre-commit Hooks
```bash
# Simple git hooks run before each commit
pre-commit: pnpm typecheck && pnpm lint
```

### Format Checking
```bash
# CI pipeline format verification
pnpm format:check  # Fails if formatting is inconsistent
```

## Best Practices

### For Developers
1. **Run locally**: `pnpm lint` and `pnpm format:check` before committing
2. **Fix automatically**: `pnpm lint:fix` and `pnpm format` for auto-fixable issues
3. **Review warnings**: Address ESLint warnings promptly
4. **Type safety**: Leverage TypeScript to catch issues at compile time

### For Code Reviews
1. **Check linting**: Ensure PRs pass all linting rules
2. **Format consistency**: Verify code follows Prettier standards
3. **Type coverage**: Review TypeScript usage and type safety
4. **Performance impact**: Consider performance implications of changes

## Troubleshooting

### Common Issues

#### ESLint Performance
- **Solution**: Use `parserOptions.project` for better TypeScript performance
- **Benefit**: Faster linting with accurate type information

#### Prettier Conflicts
- **Solution**: Prettier plugin handles ESLint integration automatically
- **Benefit**: No manual conflict resolution needed

#### Monorepo Challenges
- **Solution**: Flat configuration with file-specific overrides
- **Benefit**: Consistent rules across packages with package customization

## Future Improvements

1. **Enhanced Type Checking**: Stricter TypeScript rules for better type safety
2. **Performance Rules**: Add rules specifically targeting performance anti-patterns
3. **Automated Fixes**: More ESLint rules with auto-fix capabilities
4. **Documentation**: Inline documentation for complex rule exceptions
