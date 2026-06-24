import type { Metadata } from "next";

/** Dark claw on white — favicon / UI on light backgrounds */
export const BRAND_ICON_LIGHT = "/black-icon-white-bg.png";

/** White claw on black — favicon / UI on dark backgrounds */
export const BRAND_ICON_DARK = "/white-icon-black-bg.png";

export const brandMetadataIcons: NonNullable<Metadata["icons"]> = {
  icon: [
    { url: BRAND_ICON_LIGHT, media: "(prefers-color-scheme: light)" },
    { url: BRAND_ICON_DARK, media: "(prefers-color-scheme: dark)" },
  ],
  apple: BRAND_ICON_DARK,
};

export function brandOgImageUrl(siteUrl: string): string {
  return `${siteUrl}${BRAND_ICON_DARK}`;
}
