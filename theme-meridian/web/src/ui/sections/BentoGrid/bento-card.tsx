import { ArrowDown, ArrowRight } from "lucide-react";
import { stegaClean } from "next-sanity";

import { cn } from "@/lib/utils";
import { FeatureIcon } from "@/ui/components/feature-icon";
import { BaseLink } from "@/ui/components/Link/BaseLink";

import { BentoCard as BentoCardType } from "./types";

interface BentoCardProps {
  card: BentoCardType;
  linkStyle: "arrow" | "label";
  cardStyle: BentoCardStyle;
}

export type BentoCardStyle = "card" | "plain" | "compact";

export const BentoCard = ({ card, linkStyle, cardStyle }: BentoCardProps) => {
  const { size, icon, statLabel, statValue, title, description, link } = card;
  const isWide = stegaClean(size) === "wide";
  const hasLink = !!link;
  const showLabel = hasLink && linkStyle === "label";
  const isInPageLink = [link?.internalPath, link?.params, link?.external].some((part) =>
    stegaClean(part ?? "").includes("#"),
  );
  const LabelArrow = isInPageLink ? ArrowDown : ArrowRight;

  const iconTile = icon ? (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
      <FeatureIcon icon={icon} className="size-5" />
    </span>
  ) : null;

  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        {iconTile ?? <span />}
        {hasLink && !showLabel && (
          <ArrowRight
            className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
            aria-hidden
          />
        )}
      </div>

      <div className="mt-auto flex flex-col gap-1.5 pt-8">
        {(statLabel || statValue) && (
          <p className="mb-2 flex items-baseline gap-3">
            {statLabel && (
              <span className="text-10 font-medium tracking-wider text-muted-foreground uppercase">
                {statLabel}
              </span>
            )}
            {statValue && (
              <span className="text-22 leading-none font-medium text-foreground">
                {statValue}
              </span>
            )}
          </p>
        )}
        <p className="text-16 font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-14 text-balance text-muted-foreground md:text-16">
            {description}
          </p>
        )}
        {showLabel && link?.label && (
          <span className="mt-3 inline-flex items-center gap-1.5 text-14 font-medium text-foreground">
            {link.label}
            <LabelArrow
              className={cn(
                "size-4 transition-all",
                isInPageLink
                  ? "group-hover:translate-y-0.5"
                  : "group-hover:translate-x-0.5",
              )}
              aria-hidden
            />
          </span>
        )}
      </div>
    </>
  );

  const compactBody = (
    <div className="flex items-start gap-4">
      {iconTile}
      <div className="flex flex-col gap-1">
        <p className="text-16 font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-14 text-balance text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );

  const frame =
    "card-frame overflow-hidden rounded-lg border-4 border-background bg-card shadow-card";
  const isFramed = cardStyle !== "plain";
  const className = cn(
    "group flex h-full flex-col",
    cardStyle === "card" && [frame, "min-h-48 p-6"],
    cardStyle === "compact" && [frame, "p-5"],
    isFramed && hasLink && "transition-shadow hover:shadow-xl",
    isWide && "sm:col-span-2",
  );
  const content = cardStyle === "compact" ? compactBody : body;

  // Layout stays on the wrapper: a link that resolves to nothing makes BaseLink render bare children.
  return (
    <div className={className}>
      {hasLink ? (
        <BaseLink link={link} className="flex flex-1 flex-col">
          {content}
        </BaseLink>
      ) : (
        <div className="flex flex-1 flex-col">{content}</div>
      )}
    </div>
  );
};
