import { stegaClean } from "next-sanity";

import sectionProps from "@/lib/sectionProps";
import { cn } from "@/lib/utils";

import { ButtonLink } from "../../components/button/button-link";
import RichText from "../../RichText";

import { TextBlockProps } from "./types";

const TextBlockSection = ({ textAlign, content, ctas, ...props }: TextBlockProps) => {
  const isCentered = stegaClean(textAlign) === "center";

  return (
    <section
      className={cn("section py-12 md:py-16", isCentered && "md:py-24")}
      {...sectionProps(props)}
    >
      <div
        className={cn(
          "max-w-xl",
          isCentered && "mx-auto flex flex-col items-center text-center text-balance",
        )}
      >
        {content && <RichText value={content} className="text-foreground" />}
        {!!ctas?.length && (
          <div
            className={cn(
              "mt-6 flex flex-wrap items-center gap-4",
              isCentered && "mt-8 justify-center",
            )}
          >
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
        )}
      </div>
    </section>
  );
};

export default TextBlockSection;
