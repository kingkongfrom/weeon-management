import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // eslint-plugin-react-hooks v7 (via eslint-config-next, Next 16 toolchain)
      // enables the React-Compiler-era rules as errors. They flag pre-existing
      // patterns needing per-component review — kept as warnings. QA-10.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    // Minified vendor bundles served as static assets (MapLibre).
    "public/**",
  ]),
]);

export default eslintConfig;
