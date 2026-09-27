# Marketing site analytics (Ops)

Geographic page views for **https://weeon.school**, shown on **Ops → Analytics**.

## Data flow

1. **weeon-marketing** — `PageViewBeacon` sends one view per path per browser session to `POST /api/analytics/page-view`.
2. The route reads **Vercel geo headers** (`x-vercel-ip-country`, `x-vercel-ip-country-region`). No IP is stored.
3. Rows land in **`marketing_site_page_views`** (migration `20260926120000_marketing_site_page_views.sql` in **weeon-tenants**).
4. **weeon-management** aggregates with the **service-role** client (same as other Ops reads).

## Env (marketing)

Copy from the shared Supabase project (server-only):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional local dev: `MARKETING_ANALYTICS_DEV_GEO=CR-SJ` when edge headers are missing.

## Env (Ops)

Uses existing `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Apply the migration on the hosted DB before expecting data.

## Map UI

- **[React Map GL](https://visgl.github.io/react-map-gl/)** + **[MapLibre GL](https://maplibre.org/maplibre-gl-js/docs/)** choropleth on a minimal Weeon-tinted canvas (no raster basemap); preset **LATAM** vs **World**.
- MapLibre’s worker is copied to `public/maplibre/` on `postinstall` / `predev` / `prebuild` (Next **Turbopack** does not emit the worker’s sibling module). See MapLibre [bundler docs](https://www.maplibre.org/maplibre-gl-js/docs/).
- Click a country to filter provinces/regions (when the edge sends `region_code`).
- Range: 7 / 30 / 90 days (`/dashboard?range=30`).
