import type { Metadata } from "next";

export const BRAND_ICON_LIGHT = "/black-icon-white-bg.png";
export const BRAND_ICON_DARK = "/white-icon-black-bg.png";
export const BRAND_ICON_MARK = "/white-icon-without-bg.png";
export const BRAND_FAVICON = "/favicon.ico";

export const brandMetadataIcons: NonNullable<Metadata["icons"]> = {
  icon: BRAND_FAVICON,
  shortcut: BRAND_FAVICON,
  apple: BRAND_ICON_MARK,
};

export function brandOgImageUrl(siteUrl: string): string {
  return `${siteUrl}${BRAND_ICON_MARK}`;
}
