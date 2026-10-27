import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const versions = ["package.json", "desktop/package.json", "cli/package.json"].map((file) => ({
  file, version: JSON.parse(fs.readFileSync(path.join(root, file), "utf8")).version,
}));
if (versions.some(({ version }) => version !== versions[0].version)) {
  throw new Error(`Release versions must match: ${versions.map(({ file, version }) => `${file}=${version}`).join(", ")}`);
}
if (process.env.GITHUB_REF_TYPE === "tag" && process.env.GITHUB_REF_NAME !== `v${versions[0].version}`) {
  throw new Error(`Tag must be v${versions[0].version}; update all package versions before tagging a release.`);
}
console.log(`[desktop] Release version ${versions[0].version}`);
