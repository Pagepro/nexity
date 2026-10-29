import sectionProps from "@/lib/sectionProps";

import { ButtonLink } from "../../components/button/button-link";
import RichText from "../../RichText";

import { FaqProps } from "./types";

const FaqCtas = ({ ctas }: Pick<FaqProps, "ctas">) =>
  ctas?.length ? (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {ctas.map((cta, key) =>
        cta.link ? (
          <ButtonLink
            key={key}
            className="block"
            {...cta}
            variant={cta.variant || undefined}
            link={cta.link}
          >
            {typeof cta.link === "string" ? cta.link : cta.link.label}
          </ButtonLink>
        ) : null,
      )}
    </div>
  ) : null;

const FaqSection = ({ pretitle, content, ctas, items, ...props }: FaqProps) => {
  if (!items?.length) {
    return null;
  }

  return (
    <section className="py-12 md:py-24" {...sectionProps(props)}>
      <div className="section flex flex-col items-center gap-8 md:gap-12">
        {(pretitle || content || ctas?.length) && (
          <div className="flex max-w-sm flex-col items-center gap-4 text-center text-balance">
            {pretitle && <p className="pretitle">{pretitle}</p>}
            {content && (
              <div className="richtext">
                <RichText value={content} />
              </div>
            )}
            <FaqCtas ctas={ctas} />
          </div>
        )}

        <div className="flex w-full flex-col gap-6 md:gap-8">
          {items.map((item) => (
            <div
              key={item._key}
              className="grid gap-2 border-t border-border pt-6 md:grid-cols-2 md:gap-6 md:pt-8"
            >
              <p className="text-16 leading-8 font-medium text-foreground">
                {item.question}
              </p>
              <p className="text-16 leading-7 text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
