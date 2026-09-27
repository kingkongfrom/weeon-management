import { setWorkerUrl } from "maplibre-gl";

let configured = false;

/** Next/Turbopack cannot bundle the worker sibling import — serve from `public/maplibre/`. */
export function configureMapLibreWorker(): void {
  if (configured || typeof window === "undefined") return;
  configured = true;
  setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
}
