import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Intentional patterns in this codebase (modals, hydration, debounced search).
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["lib/queries/**"],
    rules: {
      // Supabase query builder generics use loose Function constraints to avoid
      // "Type instantiation is excessively deep" TS errors when chaining filters.
      "@typescript-eslint/no-unsafe-function-type": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "supabase/.temp/**",
  ]),
]);

export default eslintConfig;
