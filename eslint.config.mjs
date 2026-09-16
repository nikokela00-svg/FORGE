// ESLint flat config — FORGE codebase
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "next-env.d.ts",
    "coverage/**",
    ".husky/**",
    "public/**",
  ]),

  ...nextVitals,
  ...nextTs,

  // Base rules — all TypeScript sources
  {
    files: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*"],
              message:
                "Cross-feature imports must go through the public barrel (features/<name>/index.ts).",
            },
          ],
        },
      ],
    },
  },

  // Type-checked strict rules for TS/TSX files
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
  })),

  {
    files: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Layer boundary: shared/ must never import from features/
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*"],
              message: "shared/ must not import from features/.",
            },
          ],
        },
      ],
    },
  },

  // Relax type-checked rules for config/test-setup files
  {
    files: [
      "scripts/**/*.mjs",
      "vitest.config.mts",
      "playwright.config.ts",
      "eslint.config.mjs",
    ],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Prettier must run last to format everything
  {
    rules: {
      "prettier/prettier": "off",
    },
  },
]);
