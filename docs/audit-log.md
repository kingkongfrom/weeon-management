# Platform-internal audit tables

*Reading the ops/audit tables the console exposes. These already live in the
shared Supabase project (created additively in `weeon-admin`). The console makes
them visible to staff so the org can operate and troubleshoot without touching
the raw DB.*

## Purpose

These are **platform-internal**, not school-facing. Combine them with the
per-tenant `tenants` / `profiles` views to understand what the organization is
doing and whether each tenant is healthy.

## Tables & signals

### `tenant_backups`

Per-tenant snapshot rows written by backup RPCs (scheduled via a cron hitting
`weeon-admin` → `/api/backup/autosnapshot`, guarded by `CRON_SECRET`).

| Column | Meaning |
| ------ | ------- |
| `id` | backup id |
| `tenant_id` | which tenant |
| `kind` | snapshot kind (e.g. auto/manual) |
| `as_of`, `created_at` | when captured |
| `row_count` | rows snapshotted |
| `payload` | JSON snapshot |
| `note` | optional note |

**Health use:** newest backup per tenant and whether it's recent (default
interval 6h; keep count `BACKUP_KEEP`, default 12). A tenant with no recent
backup is a flag.

Relevant RPCs: `capture_tenant_backup`, `backup_all_tenants`,
`restore_tenant_backup`. The console should surface backup **status/recency**
(read-only) and not trigger restores from the ops UI lightly.

### `trial_requests`

The trial-request funnel (marketing asked on a Código SABER).

| Column | Meaning |
| ------ | ------- |
| `saber_code` | school code that requested |
| `email` | requester email |
| `email_verified` | whether verified |
| `tenant_id` | nullable — linked once claimed |
| `consumed_at`, `token_iat` | token lifecycle |

**Health use:** number of pending/unconsumed requests, conversion funnel
(request → verified → claimed → trial → paid).

### `tenant_restore_log`, `tenant_admin_log`

Operational / admin action logs used by `weeon-admin` for restore and admin
actions. Read them read-only to give staff a historical trail of admin/restore
operations per tenant.

### `admin_invites`, `admin_password_resets`

School-admin onboarding mechanics (invite + password-reset attempts). Useful to
spot stuck onboarding (an invite issued but never accepted).

## Console patterns

- All reads **read-only**, **platform scope**, service-role server-only.
- Prefer aggregations/recent-rows selects with sensible limits, ordered by
  `created_at desc`.
- Never surface `payload` JSON blobs wholesale in the UI unless on an explicit
  detail view.
- Tag data labeled clearly: **backups**, **audit/ops log**, **trial funnel**.

## Verification checklist for agents

1. Am I reading read-only? Ops/audit tables are monitored, not mutated here.
2. Am I scoping by tenant when reviewing a single school (platform staff may
   filter), and only cross-scoping for global roll-ups?
3. Is the caller authorized (platform staff) before exposing any of this?
