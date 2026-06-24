import Image from "next/image";
import { BRAND_ICON_DARK, BRAND_ICON_LIGHT } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  alt?: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  alt = "GitClaw",
  width,
  height,
  className,
  priority,
}: BrandLogoProps) {
  return (
    <>
      <Image
        src={BRAND_ICON_LIGHT}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={cn("dark:hidden", className)}
      />
      <Image
        src={BRAND_ICON_DARK}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={cn("hidden dark:block", className)}
      />
    </>
  );
}
