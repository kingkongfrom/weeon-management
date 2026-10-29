# Ops console — UI patterns

*Form controls and display conventions for `weeon-management`. School-facing
apps (`weeon-tenants`, `weeon-teachers`) share the same control tokens; keep
them aligned when you touch both.*

## Hub card chrome (ERP Community tiles)

Dashboard shortcut cards in the **school ERP** (e.g. **Community / Comunidad**)
use a **neutral border plus a soft tone-colored ring** — not a thick
`brand-gradient` top bar and not a flat gray-only outline.

Canonical tokens: `weeon-tenants/lib/dashboard/hub-tones.ts` (`hubTonePill`,
`ModuleTile` in `components/dashboard/module-grid.tsx`).

Ops copies the same rings in `lib/dashboard/hub-tones.ts`:

```ts
dashboardHubCardClass("blue"); // school detail hero, etc.
// => rounded-2xl border border-border bg-surface shadow-sm ring-1 ring-[#9ec5eb]/70 …
```

| Tone | Ring (light) |
| ---- | ------------- |
| `blue` | `#9ec5eb` at 70% — people / default school chrome |
| `purple` | `#c4b0ef` |
| `yellow` | `#f5d88a` |
| `green` | `#7dd3c7` |

Inner overview panels use `DASHBOARD_PANEL_BORDER` (`border-border/80`) without
the tone ring unless they are hub-style tiles.

## Select / dropdown (required for new UI)

**Do not add native `<select>` elements** for filters, wizards, or forms in new
Ops work. Browser defaults break Weeon focus rings, menu elevation, dark mode,
and keyboard behavior.

Use the shared custom control:

| Piece | Path |
| ----- | ---- |
| Select (listbox) | `components/ui/select.tsx` |
| Shared sizing / labels | `components/ui/control-classes.ts` |

Canonical reference implementation (with optional country flags):
`weeon-tenants/components/ui/select.tsx`.

### When to use

- Audit / log filters (time range, event type)
- Any single-choice field where the user picks one of several labeled options

### Props & sizing

- Default **`size="sm"`** (`h-8`, `rounded-lg`) for toolbars and filter rows.
- Use **`size="md"`** (`h-11`, `rounded-xl`) on full-width form fields (same
  height as text inputs in the create-school wizard).
- Always pass a visible **`label`** (or `ariaLabel` when the label is visually
  hidden). The trigger is a `<button type="button">`, not a nested label.

### Visual tokens (do not invent new classes)

- Trigger: `border-border`, `bg-surface`, brand focus ring
  `focus-visible:ring-brand-500/15`, open state `border-brand-500`.
- Menu: `shadow-elevated`, `rounded-xl`, `border-border`, `bg-surface`.
- Selected option: `bg-brand-50` / `text-brand-700` (dark: `brand-950/50`).

Compose with `cn()` only for layout (`min-w`, grid width), not for one-off
border colors.

## Text inputs (legacy note)

Some older Ops screens still use inline `FIELD` / `inputClass` strings
(`create-tenant-wizard`, ops email compose). **New code** should prefer
`controlInputClass()` from `control-classes.ts` or the same tokens as `FIELD`:

`h-11 rounded-lg border border-border bg-surface … focus:ring-brand-500/15`.

Migrating legacy native `<select>` to `Select` is encouraged when you edit
those files.

## Timestamps in Ops

Cross-tenant audit and activity lists display instants in **Costa Rica**
(`America/Costa_Rica`) via `lib/datetime/costa-rica.ts` — not the viewer’s
local timezone and not raw UTC formatted in en-US local time.

Filter footers should repeat the hint: **“Times shown in Costa Rica (UTC−6)”**.

## School detail navigation (Ops)

Use **`TenantDetailNav`** + query param **`?section=`** (`modules` · `people` ·
`overview` · `activity`). Underline tabs with brand active indicator — not the
animated segmented pill (`segmented-tabs.tsx` is legacy / other surfaces only).

Shareable example: `/dashboard/tenants/{id}?section=activity`.

## Mobile bottom nav

Five destination rows at most — never one icon per route. The bar carries the
four daily stops (**Inicio · Agenda · Colegios · Correo**) plus **Menú**, which
opens a bottom sheet with every destination grouped *Principal · Operación ·
Administración* (icon + full label, 48px rows). Health keeps its red dot on the
Menú button; the current page inside the sheet shows an "Aquí" pill.

Implementation: `components/dashboard/mobile-nav.tsx`. Labels use the
`…Short` keys in `lib/i18n/messages.ts` so the bar never truncates ("Agenda",
"Colegios", "Correo", "Menú").

## Ops Correo on phones

The mailbox keeps three panes on desktop (`lg+`) but behaves like the mobile
apps below that: **list → reader → back**, never three squeezed columns.

| Piece | Phone behaviour |
| --- | --- |
| Toolbar | one row: **folders** button (sheet), search (16px, native search keyboard), unread/failed filter (icon only), refresh, **Redactar** (icon + label from `md`) |
| Folders | bottom sheet grouped Mensajes · Carpetas · Ajustes with unread badges — the same destinations as the desktop rail |
| List | full width; each row ≥4.25rem, tap opens the reader (double-tap still opens reply on desktop) |
| Reader | replaces the list with a sticky **← Volver a mensajes** bar; subject + reply/reply-all/forward/star/trash wrap in one row; meta rows 4.25rem labels |
| Compose | edge-to-edge card on phones (`px-2`), unchanged desktop layout |

Same iOS guards as the meetings page: `dvh` heights, `-webkit-overflow-scrolling`,
`overscroll-contain`, body scroll locked while a sheet is open, Escape closes.

## Related docs

- Workspace styling tokens: `../docs/engineering.md` § Styling & tokens
- School ERP hub tones: `weeon-tenants/lib/dashboard/hub-tones.ts`
- Activity audit UI: `docs/audit-log.md`
