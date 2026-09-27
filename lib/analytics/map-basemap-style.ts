import type { StyleSpecification } from "maplibre-gl";
import type { MapStyleTheme } from "@/lib/analytics/map-style-presets";

/** Public glyph endpoint used by the MapLibre demo tiles. */
export const MAP_GLYPHS_URL =
  "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf";

export const MAP_LABEL_FONT = "Noto Sans Regular";

/** Flat cartographic canvas — neutral ocean, glyphs for country labels. */
export function marketingMapBasemapStyle(
  theme: MapStyleTheme,
): StyleSpecification {
  return {
    version: 8,
    name: "weeon-marketing-analytics",
    glyphs: MAP_GLYPHS_URL,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": theme.ocean,
        },
      },
    ],
  };
}
