import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  Point,
} from "geojson";
import {
  LATAM_COUNTRY_CODES,
  MAP_LABEL_EXCLUDED_CODES,
  MAP_LABEL_EXCLUDED_NAMES,
  type MapRegionPreset,
} from "@/lib/analytics/latam";

/**
 * Locally-served, pre-simplified country outlines (LATAM + Americas context,
 * ~0.9 MB vs the 14.6 MB upstream dataset). Same-origin so it is CDN-cached.
 */
export const COUNTRIES_GEOJSON_URL = "/data/countries.geojson";

let cachedCountries: Promise<FeatureCollection> | null = null;

/** Fetch the shared country outlines once per session and reuse the result. */
export function loadCountriesGeoJson(): Promise<FeatureCollection> {
  if (!cachedCountries) {
    cachedCountries = fetch(COUNTRIES_GEOJSON_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`GeoJSON HTTP ${res.status}`);
        return res.json() as Promise<FeatureCollection>;
      })
      .catch((err: unknown) => {
        cachedCountries = null;
        throw err;
      });
  }
  return cachedCountries;
}

export function countryIsoFromFeature(
  feature: Feature<Geometry, GeoJsonProperties>,
): string | null {
  const raw =
    feature.properties?.iso ??
    feature.properties?.["ISO3166-1-Alpha-2"] ??
    feature.properties?.ISO_A2 ??
    feature.properties?.iso_a2 ??
    feature.properties?.ISO_A2_EH ??
    "";
  const iso = String(raw).toUpperCase();
  if (iso.length === 2 && iso !== "-99" && iso !== "XX") return iso;
  return null;
}

/** Human-readable country name used for the map labels. */
export function countryNameFromFeature(
  feature: Feature<Geometry, GeoJsonProperties>,
): string {
  const raw =
    feature.properties?.name ??
    feature.properties?.NAME ??
    feature.properties?.ADMIN ??
    feature.properties?.NAME_EN ??
    "";
  return String(raw);
}

export function enrichCountriesGeoJson(
  collection: FeatureCollection,
  viewsByCountry: Map<string, number>,
  preset: MapRegionPreset,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: collection.features.map((feature) => {
      const iso = countryIsoFromFeature(feature);
      const views = iso ? (viewsByCountry.get(iso) ?? 0) : 0;
      const inLatam = iso ? LATAM_COUNTRY_CODES.has(iso) : false;
      const dimmed = preset === "latam" && iso !== null && !inLatam && views === 0;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          iso: iso ?? "",
          label: countryNameFromFeature(feature),
          views,
          dimmed,
        },
      };
    }),
  };
}

type Ring = number[][];

function ringArea(ring: Ring): number {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return area / 2;
}

function ringCentroid(ring: Ring): [number, number] {
  let cx = 0;
  let cy = 0;
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    area += cross;
    cx += (ring[j][0] + ring[i][0]) * cross;
    cy += (ring[j][1] + ring[i][1]) * cross;
  }
  area /= 2;
  if (Math.abs(area) < 1e-9) {
    const n = ring.length || 1;
    const avgX = ring.reduce((sum, p) => sum + p[0], 0) / n;
    const avgY = ring.reduce((sum, p) => sum + p[1], 0) / n;
    return [avgX, avgY];
  }
  return [cx / (6 * area), cy / (6 * area)];
}

/** Centroid of the largest polygon part — one clean label point per country. */
function labelPointForFeature(
  feature: Feature<Geometry, GeoJsonProperties>,
): [number, number] | null {
  const { geometry } = feature;
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];
  let best: [number, number] | null = null;
  let bestArea = 0;
  for (const polygon of polygons) {
    const outer = polygon[0] as Ring | undefined;
    if (!outer || outer.length < 4) continue;
    const area = Math.abs(ringArea(outer));
    if (area > bestArea) {
      bestArea = area;
      best = ringCentroid(outer);
    }
  }
  return best;
}

/**
 * One point per country (largest polygon part) so the symbol layer never draws
 * duplicate labels for archipelagos and overseas territories.
 *
 * Small island states listed in `MAP_LABEL_EXCLUDED_CODES` are skipped: their
 * labels collide and add noise at this framing. They keep their fill, border and
 * click behaviour — only the name is suppressed.
 */
export function buildCountryLabelPoints(
  collection: FeatureCollection,
): FeatureCollection {
  const features: Array<Feature<Point, GeoJsonProperties>> = [];
  for (const feature of collection.features) {
    const label = String(feature.properties?.label ?? "");
    if (!label) continue;
    const iso = String(feature.properties?.iso ?? "").toUpperCase();
    if (iso && MAP_LABEL_EXCLUDED_CODES.has(iso)) continue;
    // Islands whose dataset rows have a broken ISO code are matched by name.
    if (MAP_LABEL_EXCLUDED_NAMES.has(label.trim().toLowerCase())) continue;
    const point = labelPointForFeature(feature);
    if (!point) continue;
    features.push({
      type: "Feature",
      properties: {
        label,
        dimmed: Boolean(feature.properties?.dimmed),
      },
      geometry: { type: "Point", coordinates: point },
    });
  }
  return { type: "FeatureCollection", features };
}


