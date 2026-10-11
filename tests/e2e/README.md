# Ops console end-to-end journeys (Playwright)

Journeys from [`docs/testing.md`](../../../docs/testing.md) §7, tracked as **QA-6**.

The **sign-in smoke** test always runs. The **authenticated** journeys are
skipped unless credentials are provided, so CI stays green without a stack.

## Run

```powershell
npm run test:e2e
```

The config starts `next dev` on port 3400 unless `E2E_BASE_URL` is set.

## Environment

| Variable | Purpose |
| -------- | ------- |
| `E2E_BASE_URL` | Base URL of a running Ops console (skips the dev server) |
| `E2E_OPS_EMAIL` / `E2E_OPS_PASSWORD` | Seeded `@weeon.school` ops staff account |
| `E2E_OPS_CREATE_SCHOOL=1` | Enable the create-demo-school mutation (writes via service-role) |

The create-school journey **writes** to the platform database through the
service-role client. Run it only against a **non-production** stack.

## Vercel preview

Set `E2E_BASE_URL` to the Ops **Preview** deployment URL. Keep
`E2E_OPS_CREATE_SCHOOL` unset unless you accept platform writes on the linked DB.
Runbook: [`docs/e2e-preview-stack.md`](../../../docs/e2e-preview-stack.md).
