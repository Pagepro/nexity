import { Check, CircleCheck, Sparkles, TrendingUp } from "lucide-react";
import { stegaClean } from "next-sanity";

import { cn } from "@/lib/utils";
import { ButtonLink } from "@/ui/components/button/button-link";
import Image from "@/ui/components/image";
import RichText from "@/ui/RichText";

import { RowComparison } from "./row-comparison";
import { SplitRow as SplitRowType } from "./types";

interface SplitRowProps {
  row: SplitRowType;
  index: number;
}

export const SplitRow = ({ row, index }: SplitRowProps) => {
  const {
    anchor,
    eyebrow,
    badge,
    content,
    comparison,
    bulletsTitle,
    bullets,
    insight,
    ctas,
    proof,
    image,
  } = row;
  const imageLeft = index % 2 === 1;
  const hasImage = !!image?.image;
  const hasComparison = !!(
    comparison?.beforeItems?.length || comparison?.afterItems?.length
  );

  const header = (
    <div className="flex flex-col gap-5">
      {(eyebrow || badge) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {eyebrow && (
            <p className="text-10 font-medium tracking-wider text-muted-foreground uppercase">
              {eyebrow}
            </p>
          )}
          {badge && (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-12 font-medium text-foreground">
              <TrendingUp className="size-3.5 text-foreground" aria-hidden />
              {badge}
            </p>
          )}
        </div>
      )}
      {content && (
        <div className={cn("richtext text-balance", !hasImage && "max-w-3xl")}>
          <RichText value={content} />
        </div>
      )}
    </div>
  );

  const details = (
    <>
      {bullets?.length ? (
        <div className="flex flex-col gap-4">
          {bulletsTitle && <p className="pretitle">{bulletsTitle}</p>}
          {/* The body-3 size ramp on the list so the items' color-only classes never drop it. */}
          <ul className="flex flex-col gap-3 text-14 md:text-16">
            {bullets.map((bullet, bulletIndex) => (
              <li
                key={`${bulletIndex}-${bullet}`}
                className="flex items-center gap-3 text-foreground"
              >
                <Check className="size-4 shrink-0 text-foreground" aria-hidden />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {insight?.text && (
        <aside className="flex flex-col gap-1.5 rounded-lg border border-border bg-card-muted p-4">
          <p className="flex items-center gap-1.5 text-10 font-medium tracking-wider text-muted-foreground uppercase">
            <Sparkles className="size-3.5 shrink-0" aria-hidden />
            {insight.label}
          </p>
          <p className="text-14 text-foreground">{insight.text}</p>
        </aside>
      )}

      {ctas?.length ? (
        <div className="flex flex-wrap items-center gap-3">
          {ctas.map((cta, key) =>
            cta.link ? (
              <ButtonLink
                key={key}
                {...cta}
                variant={cta.variant || undefined}
                link={cta.link}
              >
                {typeof cta.link === "string" ? cta.link : cta.link.label}
              </ButtonLink>
            ) : null,
          )}
        </div>
      ) : null}
    </>
  );

  const proofLine = proof ? (
    <p className="flex items-start gap-2 text-14 text-muted-foreground">
      <CircleCheck className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
      {proof}
    </p>
  ) : null;

  const anchorProps = anchor
    ? {
        id: stegaClean(anchor),
        // html's scroll-padding-top already clears the fixed header; add a small gap.
        className: "scroll-mt-8",
      }
    : {};

  if (!hasImage) {
    return (
      <div {...anchorProps}>
        <div className="flex flex-col gap-8">
          {header}
          {hasComparison && comparison && <RowComparison comparison={comparison} />}
          <div className="grid gap-8 md:grid-cols-2 md:items-start">
            <div className="flex flex-col gap-8">{details}</div>
            {proofLine && <div className="md:justify-self-end">{proofLine}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div {...anchorProps}>
      <div className="grid items-center gap-8 md:grid-cols-5 md:gap-20">
        <div
          className={cn("flex flex-col gap-8 md:col-span-2", imageLeft && "md:order-2")}
        >
          {header}
          {hasComparison && comparison && <RowComparison comparison={comparison} />}
          {details}
          {proofLine}
        </div>

        <div
          className={cn(
            "relative aspect-[4/3] w-full overflow-hidden rounded-lg md:col-span-3",
            imageLeft && "md:order-1",
          )}
        >
          <Image
            sanityImage={image}
            sizes="(min-width: 768px) 60vw, 100vw"
            className="object-cover"
            fill
          />
        </div>
      </div>
    </div>
  );
};
