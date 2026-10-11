import { defineConfig, devices } from "@playwright/test";

// Ops console E2E journeys (docs/testing.md §7 — QA-6).
//
// Read-only/smoke by default; the create-school mutation runs only with
// E2E_OPS_CREATE_SCHOOL=1 (it writes through the service-role platform client).
// Auth-backed blocks skip when E2E_OPS_EMAIL / E2E_OPS_PASSWORD are absent.
const PORT = 3400;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  expect: { timeout: 10000 },
  retries: process.env.CI ? 1 : 0,
  fullyParallel: false,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 180000,
      },
});
