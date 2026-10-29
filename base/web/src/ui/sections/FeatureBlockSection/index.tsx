import { stegaClean } from "next-sanity";

import sectionProps from "@/lib/sectionProps";
import { ButtonLink } from "@/ui/components/button/button-link";
import RichText from "@/ui/RichText";

import { GridLayout, HeroOverlapLayout, SingleImageLayout } from "./image-layouts";
import { FeatureBlockProps } from "./types";

const FeatureBlockSection = ({
  content,
  images,
  imageLayout,
  ctas,
  ...props
}: FeatureBlockProps) => {
  const cleanLayout = stegaClean(imageLayout);

  return (
    <section className="py-12 md:py-20" {...sectionProps(props)}>
      <div className="section">
        <div className="max-w-xl">
          {content && <RichText value={content} />}
          {!!ctas?.length && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {ctas.map((cta, index) =>
                cta.link ? (
                  <ButtonLink
                    key={index}
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
      </div>

      {images?.length ? (
        <div className="section mt-10">
          {cleanLayout === "hero-overlap" && <HeroOverlapLayout images={images} />}
          {cleanLayout === "grid" && <GridLayout images={images} />}
          {cleanLayout === "single" && <SingleImageLayout images={images} />}
        </div>
      ) : null}
    </section>
  );
};

export default FeatureBlockSection;
