import "server-only";

import { DEFAULT_WEATHER_LOCATION } from "@/lib/weather/location";
import {
  fetchMetNorwayWeather,
  type WeatherSnapshot,
} from "@/lib/weather/met-norway";

/**
 * Weather for the Ops dashboard header.
 *
 * Ops has no tenant of its own, so this uses the same Costa Rica fallback the
 * school ERP uses when a school has not pinned coordinates. The MET Norway
 * request is cached for 30 minutes and any failure is invisible (null).
 */
export async function loadOpsWeather(): Promise<WeatherSnapshot | null> {
  try {
    return await fetchMetNorwayWeather(
      DEFAULT_WEATHER_LOCATION.latitude,
      DEFAULT_WEATHER_LOCATION.longitude,
    );
  } catch {
    return null;
  }
}
