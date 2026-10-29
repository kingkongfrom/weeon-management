"use client";

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";

import type { WeatherIconKind, WeatherSnapshot } from "@/lib/weather/met-norway";

const WEATHER_ICONS: Record<WeatherIconKind, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  "cloud-sun": CloudSun,
  "cloud-moon": CloudMoon,
  cloud: Cloud,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "cloud-lightning": CloudLightning,
  "cloud-snow": CloudSnow,
  "cloud-hail": CloudHail,
  "cloud-fog": CloudFog,
};

/**
 * Compact current-conditions block beside the date, same shape as the school
 * ERP's Resumen: icon, current temperature, and today's high/low.
 */
export function DashboardWeather({ weather }: { weather: WeatherSnapshot }) {
  const Icon = WEATHER_ICONS[weather.icon];
  const iconTone =
    weather.icon === "sun" ? "text-[#eab308]" : "text-[#2b59ff] dark:text-[#7aa2ff]";

  return (
    <div className="flex items-start gap-2.5">
      <Icon className={`mt-0.5 h-7 w-7 shrink-0 ${iconTone}`} aria-hidden />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-xl font-semibold leading-none text-foreground">
            {weather.temperatureC}°C
          </span>
        </div>
        <p className="text-xs text-foreground/50">
          Máx {weather.highC}° · Mín {weather.lowC}°
        </p>
      </div>
    </div>
  );
}
