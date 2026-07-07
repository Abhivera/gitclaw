import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "build/**",
    "dist/**",
    "release/**",
    "desktop/icons/**",
    "next-env.d.ts",
    "lib/generated/**",
  ]),
]);

export default eslintConfig;
