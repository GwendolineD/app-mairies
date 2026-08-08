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
  {
    files: ["lib/**", "app/**", "components/**"],
    rules: {
      // listUsers() returns at most 50 accounts (created_at DESC), silently
      // truncating older users. Use getEmailsByUserIds() from lib/services/user-emails.ts.
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='listUsers']",
          message:
            "listUsers() caps at 50 accounts — use getEmailsByUserIds (lib/services/user-emails.ts).",
        },
      ],
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
