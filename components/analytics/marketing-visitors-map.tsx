"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import Map, {
  Layer,
  Marker,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import type { FeatureCollection } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { configureMapLibreWorker } from "@/lib/maplibre-worker";

configureMapLibreWorker();
import {
  buildCountryLabelPoints,
  enrichCountriesGeoJson,
  loadCountriesGeoJson,
} from "@/lib/analytics/countries-geo";
import {
  MAP_LABEL_FONT,
  marketingMapBasemapStyle,
} from "@/lib/analytics/map-basemap-style";
import {
  buildFillColorExpression,
  getMapStyleTheme,
  type MapStylePresetId,
} from "@/lib/analytics/map-style-presets";
import { MAP_VIEW, type MapRegionPreset } from "@/lib/analytics/latam";
import { fitViewForBounds } from "@/lib/analytics/latam-fit";
import {
  LATAM_SILHOUETTE_PATH,
  LATAM_SILHOUETTE_VIEWBOX,
} from "@/lib/analytics/latam-silhouette";
import { useMapColorMode } from "@/lib/analytics/use-map-color-mode";

type Props = {
  viewsByCountry: Map<string, number>;
  maxViews: number;
  preset: MapRegionPreset;
  stylePreset: MapStylePresetId;
  selectedCountry: string | null;
  onSelectCountry: (iso: string | null) => void;
};

/**
 * Portrait frame so the tall LATAM extent fits the viewport. The ring matches
 * the purple "Top countries" card beside it (same 1px width and translucent
 * purple), so the two read as a pair.
 */
const MAP_FRAME_CLASS =
  "aspect-[3/4] w-full max-w-[585px] overflow-hidden rounded-xl ring-1 ring-[#c4b0ef]/70 dark:ring-[#5b4a9a]/80";

/** Costa Rica — Weeon home base. */
const COSTA_RICA: [number, number] = [-84.1, 9.8];

/** LATAM silhouette placeholder; the frame is supplied by the caller. */
function MapSurfaceSkeleton() {
  return (
    <div className="h-full w-full animate-pulse bg-surface-muted" aria-hidden>
      <svg
        viewBox={LATAM_SILHOUETTE_VIEWBOX}
        className="h-full w-full text-foreground/10"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d={LATAM_SILHOUETTE_PATH}
          fill="currentColor"
          fillRule="evenodd"
          stroke="currentColor"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}

export function MarketingVisitorsMap({
  viewsByCountry,
  maxViews,
  preset,
  stylePreset,
  selectedCountry,
  onSelectCountry,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colorMode = useMapColorMode();
  const theme = getMapStyleTheme(stylePreset, colorMode);

  const [rawGeo, setRawGeo] = useState<FeatureCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadCountriesGeoJson()
      .then((data) => {
        if (!cancelled) setRawGeo(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load map data");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const geoJson = useMemo(() => {
    if (!rawGeo) return null;
    return enrichCountriesGeoJson(rawGeo, viewsByCountry, preset);
  }, [rawGeo, viewsByCountry, preset]);

  const labelGeoJson = useMemo(
    () => (geoJson ? buildCountryLabelPoints(geoJson) : null),
    [geoJson],
  );

  const fillColor = useMemo(
    () => buildFillColorExpression(maxViews, theme),
    [maxViews, theme],
  );

  const initialView = useMemo(() => {
    const view = MAP_VIEW[preset];
    if (view.bounds) {
      const fit = fitViewForBounds(view.bounds, 585, 780);
      return { center: fit.center, zoom: fit.zoom, bearing: view.bearing };
    }
    return { center: view.center, zoom: view.zoom, bearing: view.bearing };
  }, [preset]);

  const mapStyle = useMemo(
    () => marketingMapBasemapStyle(theme),
    [theme],
  );

  const applyView = useCallback(
    (options?: { duration?: number }) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      const view = MAP_VIEW[preset];
      const duration = options?.duration ?? 700;
      if (view.bounds) {
        // Use our own fit math (shared with the loading silhouette) so the
        // skeleton and the map land on exactly the same camera window.
        const canvas = map.getCanvas();
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (!width || !height) return;
        const fit = fitViewForBounds(view.bounds, width, height);
        map.setMinZoom(fit.zoom);
        map.easeTo({
          center: fit.center,
          zoom: fit.zoom,
          bearing: view.bearing,
          duration,
        });
        return;
      }
      map.flyTo({ center: view.center, zoom: view.zoom, bearing: view.bearing, duration });
    },
    [preset],
  );

  useEffect(() => {
    applyView();
  }, [applyView]);

  // Re-fit when the frame size changes so LATAM stays perfectly framed.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !MAP_VIEW[preset].bounds) return;
    const observer = new ResizeObserver(() => applyView({ duration: 0 }));
    observer.observe(el);
    return () => observer.disconnect();
  }, [applyView, preset]);

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const iso = feature?.properties?.iso as string | undefined;
      if (iso && iso.length === 2) {
        onSelectCountry(iso.toUpperCase());
      }
    },
    [onSelectCountry],
  );

  if (loadError) {
    return (
      <div
        className={`${MAP_FRAME_CLASS} flex items-center justify-center px-6 text-center text-sm text-foreground/55`}
      >
        Map could not load country boundaries ({loadError}).
      </div>
    );
  }

  if (!geoJson) {
    return (
      <div className={MAP_FRAME_CLASS}>
        <MapSurfaceSkeleton />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${MAP_FRAME_CLASS} relative`}>
      <Map
        ref={mapRef}
        mapStyle={mapStyle}
        initialViewState={{
          longitude: initialView.center[0],
          latitude: initialView.center[1],
          zoom: initialView.zoom,
          bearing: initialView.bearing,
        }}
        scrollZoom
        dragRotate={false}
        pitchWithRotate={false}
        attributionControl={{ compact: true }}
        interactiveLayerIds={["countries-fill"]}
        cursor="grab"
        onLoad={() => applyView({ duration: 0 })}
        onIdle={() => setMapReady(true)}
        onClick={onClick}
        onMouseEnter={() => {
          const map = mapRef.current?.getMap();
          if (map) map.getCanvas().style.cursor = "pointer";
        }}
        onMouseLeave={() => {
          const map = mapRef.current?.getMap();
          if (map) map.getCanvas().style.cursor = "grab";
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Source id="countries" type="geojson" data={geoJson}>
          <Layer
            id="countries-fill"
            type="fill"
            paint={{
              "fill-color": fillColor as never,
              "fill-opacity": [
                "case",
                ["get", "dimmed"],
                theme.dimmedOpacity,
                theme.fillOpacity,
              ],
            }}
          />
          <Layer
            id="countries-line"
            type="line"
            paint={{
              "line-color": theme.border,
              "line-width": theme.borderWidth,
              "line-opacity": 0.9,
              ...(theme.borderDash ? { "line-dasharray": theme.borderDash } : {}),
            }}
          />
          {/*
            Selection is a paint wash plus an outline in the *same* hue, so the
            picked country reads as one object rather than a tint with a
            mismatched border. The fill sits under the outline (layer order) so
            the stroke stays crisp on top of the wash. The wash is low-alpha by
            design: the choropleth underneath must stay readable.
          */}
          <Layer
            id="countries-selected-fill"
            type="fill"
            layout={{ visibility: selectedCountry ? "visible" : "none" }}
            filter={["==", ["get", "iso"], selectedCountry ?? ""]}
            paint={{
              "fill-color": theme.selectedFill,
            }}
          />
          <Layer
            id="countries-selected"
            type="line"
            layout={{ visibility: selectedCountry ? "visible" : "none" }}
            filter={["==", ["get", "iso"], selectedCountry ?? ""]}
            paint={{
              "line-color": theme.selected,
              "line-width": theme.selectedWidth,
            }}
          />
        </Source>

        {labelGeoJson ? (
          <Source id="country-labels" type="geojson" data={labelGeoJson}>
            <Layer
              id="country-label"
              type="symbol"
              layout={{
                "text-field": ["coalesce", ["get", "label"], ""],
                "text-font": [MAP_LABEL_FONT],
                "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  2,
                  10,
                  5,
                  12,
                ],
                "text-max-width": 8,
                "text-letter-spacing": 0.04,
                "text-allow-overlap": false,
                "text-padding": 8,
              }}
              paint={{
                "text-color": theme.label,
                "text-halo-color": theme.labelHalo,
                "text-halo-width": 1.2,
                "text-opacity": [
                  "case",
                  ["get", "dimmed"],
                  theme.labelOpacity * 0.4,
                  theme.labelOpacity,
                ],
              }}
            />
          </Source>
        ) : null}

        <Marker
          longitude={COSTA_RICA[0]}
          latitude={COSTA_RICA[1]}
          anchor="bottom"
        >
          <MapPin
            className="h-3.5 w-3.5 text-brand-600 drop-shadow-sm dark:text-brand-300"
            strokeWidth={2.5}
            fill="currentColor"
          />
        </Marker>
      </Map>

      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out ${
          mapReady ? "opacity-0" : "opacity-100"
        }`}
      >
        <MapSurfaceSkeleton />
      </div>

      <button
        type="button"
        onClick={() => applyView()}
        aria-label="Recenter map on LATAM"
        title="Recenter"
        className="absolute bottom-3 right-3 z-10 text-foreground/60 drop-shadow-sm transition-colors hover:text-foreground/85"
      >
        <LocateFixed className="h-7 w-7" />
      </button>
    </div>
  );
}
