import { ButtonLink } from "@/ui/components/button/button-link";
import Image from "@/ui/components/image";

import RichText from "./index";
import { CalloutValue } from "./types";

const RichTextCallout: React.FC<{ value: CalloutValue }> = ({ value }) => {
  const { content, cta, backgroundImage } = value;

  if (!content?.length && !cta?.link) return null;

  return (
    <div className="richtext-embed relative isolate overflow-hidden rounded-lg border border-foreground/10 p-8 md:-mx-8">
      {backgroundImage?.image && (
        <div className="pointer-events-none absolute inset-0 -z-10 select-none">
          <Image
            sanityImage={backgroundImage}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover object-bottom"
          />
          <div className="absolute inset-0 bg-background/20" />
        </div>
      )}

      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
        {content?.length ? (
          <div className="md:max-w-sm">
            <RichText value={content} />
          </div>
        ) : null}

        {cta?.link && (
          <ButtonLink
            link={cta.link}
            variant={cta.variant || "primary"}
            buttonIcon={cta.buttonIcon}
            className="shrink-0"
          >
            {typeof cta.link === "string" ? cta.link : cta.link.label}
          </ButtonLink>
        )}
      </div>
    </div>
  );
};

export default RichTextCallout;
