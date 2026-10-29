import sectionProps from "@/lib/sectionProps";
import Image from "@/ui/components/image";

import { ButtonLink } from "../../components/button/button-link";
import RichText from "../../RichText";

import { CtaBannerProps } from "./types";

const CtaBannerCtas = ({ ctas }: Pick<CtaBannerProps, "ctas">) =>
  ctas?.length ? (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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

const CtaBanner = ({
  content,
  ctas,
  backgroundImage,
  image,
  ...props
}: CtaBannerProps) => {
  const hasBackground = !!backgroundImage?.image;
  const hasProductImage = !!image?.image;

  return (
    <section
      className="data-[last-module=true]:pb-12 md:data-[last-module=true]:pb-24"
      {...sectionProps(props)}
    >
      <div className="section">
        <div className="card-frame isolate flex min-h-[var(--cta-banner-min-height)] overflow-hidden rounded-xl border-4 border-background shadow-card [--card-frame-radius:var(--radius-xl)]">
          {hasBackground && (
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
              <Image
                sanityImage={backgroundImage}
                sizes="(max-width: 80rem) 100vw, 1280px"
                className="object-cover"
                draggable={false}
                fill
              />
            </div>
          )}

          <div className="grid w-full gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-7 px-8 pt-12 pb-8 lg:py-16 lg:ps-16">
              {content && (
                <div className="richtext text-balance">
                  <RichText value={content} />
                </div>
              )}
              <CtaBannerCtas ctas={ctas} />
            </div>

            {hasProductImage && (
              <div className="relative min-h-64 md:min-h-96 lg:min-h-0">
                <div className="absolute inset-y-0 right-0 left-8 overflow-hidden rounded-tl-lg lg:top-16 lg:left-0">
                  <Image
                    sanityImage={image}
                    sizes="(max-width: 64rem) 100vw, 50vw"
                    className="object-cover object-left-top"
                    draggable={false}
                    fill
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-black/10" />
        </div>
      </div>
    </section>
  );
};

export default CtaBanner;
