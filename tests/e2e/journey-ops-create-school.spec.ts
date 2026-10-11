import { test, expect } from "@playwright/test";

// Journey 6 (docs/testing.md §7): Ops creates a demo school and it appears in
// the tenant list.
//
// The create step writes through the service-role platform client, so it runs
// only with E2E_OPS_CREATE_SCHOOL=1 against a non-production stack. The default
// run is read-only: sign-in + tenant list renders.

const OPS_EMAIL = process.env.E2E_OPS_EMAIL;
const OPS_PASSWORD = process.env.E2E_OPS_PASSWORD;
const hasCreds = Boolean(OPS_EMAIL && OPS_PASSWORD);
const doCreate = process.env.E2E_OPS_CREATE_SCHOOL === "1";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.locator('input[name="email"]').fill(OPS_EMAIL!);
  await page.locator('input[name="password"]').fill(OPS_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}

test.describe("Ops console", () => {
  test("sign-in page renders", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test.describe("authenticated", () => {
    test.skip(!hasCreds, "E2E_OPS_EMAIL / E2E_OPS_PASSWORD not configured");

    test("tenant list renders", async ({ page }) => {
      await signIn(page);
      await page.goto("/dashboard/tenants");
      await expect(page.locator("body")).toContainText(/school|tenant|institución/i, {
        timeout: 20000,
      });
    });

    test("created demo school appears in the tenant list", async ({ page }) => {
      test.skip(!doCreate, "Set E2E_OPS_CREATE_SCHOOL=1 to run the create mutation");

      const schoolName = `E2E Demo ${Date.now()}`;
      await signIn(page);
      await page.goto("/dashboard/onboarding");

      // The wizard is a multi-field form; names/ids mirror the ERP create API.
      await page.getByLabel(/nombre|name/i).first().fill(schoolName);
      await page.getByLabel(/saber/i).first().fill("999999-99");
      await page
        .getByRole("button", { name: /crear|crear escuela|create/i })
        .first()
        .click();

      await page.goto("/dashboard/tenants");
      await expect(page.locator("body")).toContainText(schoolName, {
        timeout: 30000,
      });
    });
  });
});
