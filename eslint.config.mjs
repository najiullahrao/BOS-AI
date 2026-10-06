import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ad-hoc Playwright smoke scripts (gitignored scratch tooling).
    // Narrowed from e2e/** so committed test files added later get linted.
    "e2e/smoke-*.js",
  ]),
]);

export default eslintConfig;
