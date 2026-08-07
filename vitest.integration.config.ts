import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Vite deliberately ignores `.env.local` when the mode is `test`, and Vitest
// forces that mode. Loading it explicitly is what keeps the local Supabase
// credentials reachable from the integration suite.
const env = loadEnv("development", process.cwd(), "");

export default defineConfig({
  test: {
    environment: "node",
    // `.itest.ts` does not match the `**/*.test.ts` pattern of vitest.config.ts,
    // so the unit suite stays untouched and Docker-free.
    include: ["tests/integration/**/*.itest.ts"],
    // Fixtures share a single database and fixed INSEE codes: running files in
    // parallel would let them tear down each other's data.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
