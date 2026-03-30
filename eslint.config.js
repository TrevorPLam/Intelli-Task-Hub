/**
 * ESLint Flat Configuration for Intelli-Task-Hub
 *
 * Modern ESLint 9+ flat configuration following 2026 best practices.
 * Supports monorepo with package-specific configurations and Prettier integration.
 *
 * @fileoverview ESLint flat configuration for monorepo
 * @version 1.0.0
 * @since 2026-03-30
 * @author Intelli-Task-Hub Team
 */

import js from "@eslint/js";
import ts from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-plugin-prettier/recommended";
import globals from "globals";

export default [
  // Global ignores for all configurations
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/generated/**",
      "**/.expo/**",
      "**/.replit-artifact/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/pnpm-lock.yaml",
      "**/*.config.js",
      "**/*.config.mjs",
    ],
  },

  // Base configuration for all TypeScript/JavaScript files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        project: true,
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": ts,
      react: react,
      "react-hooks": reactHooks,
      prettier: prettier,
    },
    rules: {
      // JavaScript recommended rules
      ...js.configs.recommended.rules,

      // TypeScript recommended rules
      ...ts.configs.recommended.rules,
      ...ts.configs.stylisticTypeChecked.rules,

      // React recommended rules
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Prettier integration (must come last)
      ...prettier.rules,

      // Custom rules
      "no-console": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // React-specific overrides
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // API Server specific configuration
  {
    files: ["artifacts/api-server/**/*.{js,ts}"],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        project: "./artifacts/api-server/tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Inherit base rules and add server-specific rules
      "no-process-exit": "error",
      "no-unused-vars": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "prefer-const": "error",
    },
  },

  // React Native specific configuration
  {
    files: ["artifacts/mobile/**/*.{js,ts,tsx}"],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        project: "./artifacts/mobile/tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        React: "readonly",
      },
    },
    rules: {
      // React Native specific rules
      "react-native/no-unused-styles": "error",
      "react-native/no-inline-styles": "warn",
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },

  // Database library specific configuration
  {
    files: ["lib/db/**/*.{js,ts}"],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        project: "./lib/db/tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Database specific rules
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "no-var": "error",
    },
  },
];
