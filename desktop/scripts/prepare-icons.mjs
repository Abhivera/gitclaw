/**
 * Generates square desktop app icons from the GitClaw brand assets.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(path.join(root, "package.json"));
const sharp = require("sharp");
const iconsDir = path.join(root, "desktop", "icons");
const sourcePng = path.join(root, "public", "white-icon-black-bg.png");
const sourceIco = path.join(root, "public", "favicon.ico");

fs.mkdirSync(iconsDir, { recursive: true });

const iconSize = 512;
const logo = sharp(sourcePng);
const maxLogoWidth = Math.round(iconSize * 0.72);
const maxLogoHeight = Math.round(iconSize * 0.72);
const resizedLogo = await logo
  .resize(maxLogoWidth, maxLogoHeight, { fit: "inside", withoutEnlargement: true })
  .png()
  .toBuffer();
const logoMeta = await sharp(resizedLogo).metadata();
const left = Math.max(0, Math.floor((iconSize - (logoMeta.width ?? iconSize)) / 2));
const top = Math.max(0, Math.floor((iconSize - (logoMeta.height ?? iconSize)) / 2));

await sharp({
  create: {
    width: iconSize,
    height: iconSize,
    channels: 4,
    background: { r: 10, g: 10, b: 10, alpha: 1 },
  },
})
  .composite([{ input: resizedLogo, left, top }])
  .png()
  .toFile(path.join(iconsDir, "icon.png"));

fs.copyFileSync(sourceIco, path.join(iconsDir, "icon.ico"));
fs.copyFileSync(
  path.join(root, "public", "white-icon-without-bg.png"),
  path.join(root, "desktop", "splash-mark.png"),
);

console.log(`[desktop] App icons prepared in ${iconsDir}`);
