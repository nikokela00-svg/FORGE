// ESLint flat config — FORGE codebase
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

// FORGE custom rules — enforce the design system conventions
const forgeRules = {
  rules: {
    "no-arbitrary-tailwind": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Ban arbitrary Tailwind values in literal className strings (w-[347px]).",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== "className") {
              return;
            }
            const valueNode = node.value;
            if (
              valueNode === null ||
              valueNode.type !== "Literal" ||
              typeof valueNode.value !== "string"
            ) {
              return;
            }
            if (/(?<!aria)(?<!data)(?<!min)-\[/.test(valueNode.value)) {
              context.report({
                node,
                message:
                  "Arbitrary Tailwind values are banned. Use spacing, radii, and type from the design scales. Exceptions need a comment with justification.",
              });
            }
          },
        };
      },
    },
  },
};

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
      forge: forgeRules,
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

      "forge/no-arbitrary-tailwind": "error",
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
