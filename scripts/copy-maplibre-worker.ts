import { cpSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const maplibreRoot = path.dirname(require.resolve("maplibre-gl/package.json"));
const distDir = path.join(maplibreRoot, "dist");
const outDir = path.join(projectRoot, "public", "maplibre");

const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"] as const;

mkdirSync(outDir, { recursive: true });
for (const name of files) {
  cpSync(path.join(distDir, name), path.join(outDir, name));
}

console.log(`Copied MapLibre worker assets to ${outDir}`);
