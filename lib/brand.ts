import type { Metadata } from "next";

/** Dark claw on white for UI on light backgrounds */
export const BRAND_ICON_LIGHT = "/black-icon-white-bg.png";

/** White claw on black for favicon, dark UI, and social previews */
export const BRAND_ICON_DARK = "/white-icon-black-bg.png";

export const brandMetadataIcons: NonNullable<Metadata["icons"]> = {
  icon: BRAND_ICON_DARK,
  shortcut: BRAND_ICON_DARK,
  apple: BRAND_ICON_DARK,
};

export function brandOgImageUrl(siteUrl: string): string {
  return `${siteUrl}${BRAND_ICON_DARK}`;
}
