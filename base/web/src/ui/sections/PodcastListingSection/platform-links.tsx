import { stegaClean } from "next-sanity";
import { FaApple, FaRss, FaSpotify, FaYoutube } from "react-icons/fa6";

import { cn } from "@/lib/utils";
import ButtonBase from "@/ui/components/button/button-base";
import { BaseLink } from "@/ui/components/Link/BaseLink";

import { PLATFORM_LABELS } from "./constants";
import { PlatformLink } from "./types";

const PLATFORM_ICONS: Record<string, React.FC<React.ComponentProps<"svg">>> = {
  spotify: FaSpotify,
  apple: FaApple,
  youtube: FaYoutube,
  rss: FaRss,
};

interface PlatformLinksProps {
  links: PlatformLink[] | null | undefined;
  size?: "sm" | "md";
  primaryFirst?: boolean;
  className?: string;
}

export const PlatformLinks = ({
  links,
  size = "md",
  primaryFirst = true,
  className,
}: PlatformLinksProps) => {
  const valid = (links ?? []).filter((link) => link.url && link.platform);

  if (!valid.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {valid.map((link, index) => {
        const platform = stegaClean(link.platform) ?? "";
        const Icon = PLATFORM_ICONS[platform];
        const label = PLATFORM_LABELS[platform] ?? platform;

        return (
          <BaseLink
            key={link._key ?? `${platform}-${index}`}
            link={link.url ?? "#"}
            aria-label={`Listen on ${label}`}
          >
            <ButtonBase
              size={size}
              variant={primaryFirst && index === 0 ? "primary" : "primary-outline"}
              icon={Icon ? <Icon className="size-4" aria-hidden /> : undefined}
            >
              {index === 0 && primaryFirst ? `Listen on ${label}` : label}
            </ButtonBase>
          </BaseLink>
        );
      })}
    </div>
  );
};
