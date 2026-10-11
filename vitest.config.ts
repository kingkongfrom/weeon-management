import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths({ projects: [resolve(root, "tsconfig.json")] }), react()],
  resolve: {
    alias: { "@repo": resolve(root), "@": resolve(root) },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}", "lib/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // QA-8: floor set where the suite is (baseline 11 Oct: lines 0.54 · branches
      // 64.6 · funcs 60.7); ratchet up, scoping high bars to auth-policy/safe-path.
      thresholds: { lines: 0.4, functions: 55, branches: 58 },
    },
  },
});
