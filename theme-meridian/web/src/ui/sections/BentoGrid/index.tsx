import { stegaClean } from "next-sanity";

import sectionProps from "@/lib/sectionProps";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/ui/components/button/button-link";
import RichText from "@/ui/RichText";

import { BentoCard, BentoCardStyle } from "./bento-card";
import { BentoGridProps } from "./types";

const CARD_STYLES: readonly BentoCardStyle[] = ["card", "plain", "compact"];

const BentoGrid = ({
  cardStyle,
  linkStyle,
  pretitle,
  content,
  cards,
  ctas,
  ...props
}: BentoGridProps) => {
  if (!cards?.length) {
    return null;
  }

  const style = CARD_STYLES.find((value) => value === stegaClean(cardStyle)) ?? "card";

  return (
    <section className="py-12 md:py-24" {...sectionProps(props)}>
      <div className="section flex flex-col items-center gap-8 md:gap-12">
        {(pretitle || content) && (
          <div className="flex max-w-xl flex-col items-center gap-4 text-center text-balance">
            {pretitle && <p className="pretitle">{pretitle}</p>}
            {content && <RichText value={content} />}
          </div>
        )}

        <div
          className={cn(
            "grid w-full grid-cols-1 gap-4 sm:grid-cols-2",
            style === "compact" ? "lg:grid-cols-3" : "lg:grid-cols-4",
            style === "plain" && "gap-y-10 lg:gap-x-8",
          )}
        >
          {cards.map((card) => (
            <BentoCard
              key={card._key}
              card={card}
              linkStyle={stegaClean(linkStyle) === "label" ? "label" : "arrow"}
              cardStyle={style}
            />
          ))}
        </div>

        {ctas?.length ? (
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
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
      </div>
    </section>
  );
};

export default BentoGrid;
