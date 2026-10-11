# Security incidents & personal-data breaches (Ops)

*Runbook for Weeon staff when personal data may have been exposed. Aligns with
[`docs/privacy-compliance.md`](../../docs/privacy-compliance.md) §6 and public
policy §10 (PRODHAB, 5 business days).*

**Not for public linking.** Schools see breach commitments in
[`weeon.school/privacidad`](https://weeon.school/privacidad).

---

## When to trigger

- Suspected unauthorized access to Supabase, Storage, or Ops service-role paths.
- Leaked `.env`, service-role key, or backup file.
- RLS bypass or cross-tenant data visible in prod.
- Compromised staff/Ops or school-admin account with broad access.
- Vendor incident (hosting, email, payments) affecting Weeon school data.

If unsure, **open an incident** anyway; downgrade later.

---

## Roles

| Role | Who |
| ---- | --- |
| Incident lead | Weeon on-call / Eduardo |
| Comms to school | Ops + leadership |
| PRODHAB / legal wording | Counsel + **school responsable** |
| Technical contain | Whoever owns the affected repo |

---

## Timeline (business days = Costa Rica hábiles)

| Step | Target | Action |
| ---- | ------ | ------ |
| 1 Detect & log | Immediate | Create row in incident log (below); timestamp UTC-6 |
| 2 Contain | Same day | Revoke keys/sessions, disable route, block Ops action |
| 3 Assess | ≤ 24 h | Tenants affected, data categories, minors?, count |
| 4 Notify school | ≤ 48 h | Written summary to school admin + DPO contact if any |
| 5 Notify persons + **PRODHAB** | ≤ **5 business days** from detection | **School (responsable)** leads titular notice; Weeon assists; PRODHAB when threshold met per counsel |
| 6 Remediate + post-mortem | ≤ 10 days | Fix, rotate secrets, update [`SECURITY.md`](../../weeon-tenants/SECURITY.md) / RLS if needed |

---

## Incident log (template)

Copy into your secure ops tracker (not git):

```
ID: INC-YYYY-MM-DD-##
Detected: [date time CR]
Reporter:
Status: open | contained | closed
Tenants: [uuid…]
Categories: [cédula / grades / …]
Minors involved: yes/no/unknown
Containment:
School notified: [date]
PRODHAB notified: [date] / N/A — reason
Expediente PRODHAB (if any):
Post-mortem link:
```

---

## School notification (draft — counsel edits)

Subject: *Incidente de seguridad — Weeon School*

- Qué ocurrió (hechos conocidos, sin especulación).
- Qué datos podrían estar involucrados.
- Qué hizo Weeon para contener.
- Pasos recomendados para la institución (notificar familias, PRODHAB).
- Contacto: `contacto@weeon.school`.

---

## PRODHAB notification

Follow counsel guidance on **when** notification to PRODHAB is mandatory vs
titular-only. Public policy commits to **5 business days** when notification applies.

Prepare:

- Timeline of detection and containment.
- Categories and approximate number of affected people.
- Measures taken and planned.

Registration context: [`docs/prodhab-pack.md`](../../docs/prodhab-pack.md).

---

## Prevention pointers

- Never commit secrets; rotate if leaked.
- Ops service-role **server-only**; audit [`tenant_admin_log`](../../weeon-tenants/docs/data-access.md).
- Run [`tests/rls`](../../weeon-tenants/tests/rls/) before schema changes.
- Hosted migration parity: [`platform-hygiene.md`](../../weeon-tenants/docs/platform-hygiene.md).
