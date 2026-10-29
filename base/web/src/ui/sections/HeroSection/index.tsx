import { stegaClean } from "next-sanity";

import sectionProps from "@/lib/sectionProps";
import { cn } from "@/lib/utils";
import Image from "@/ui/components/image";

import { ButtonLink } from "../../components/button/button-link";
import RichText from "../../RichText";

import { HeroProps } from "./types";

const HeroCtas = ({
  ctas,
  buttonClassName,
}: Pick<HeroProps, "ctas"> & { buttonClassName?: string }) =>
  ctas?.length ? (
    <>
      {ctas.map((cta, key) =>
        cta.link ? (
          <ButtonLink
            key={key}
            className="block"
            buttonClassName={buttonClassName}
            {...cta}
            variant={cta.variant || undefined}
            link={cta.link}
          >
            {typeof cta.link === "string" ? cta.link : cta.link.label}
          </ButtonLink>
        ) : null,
      )}
    </>
  ) : null;

const HeroBottomImage = ({ bottomImage }: Pick<HeroProps, "bottomImage">) =>
  bottomImage?.image ? (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 select-none">
      <Image
        sanityImage={bottomImage}
        sizes="100vw"
        quality={85}
        placeholder="empty"
        // On mobile the h-36 box height sets the crop zoom (taller = more zoom).
        className="block h-36 w-full object-cover object-center md:h-auto"
        draggable={false}
      />
    </div>
  ) : null;

const HeroLogos = ({ logosTitle, logos }: Pick<HeroProps, "logosTitle" | "logos">) =>
  logos?.length ? (
    <div className="flex flex-col items-center gap-4">
      {logosTitle && <p className="pretitle">{logosTitle}</p>}
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {logos.map((logo) =>
          logo.image ? (
            <li key={logo._key}>
              <Image
                sanityImage={logo}
                sizes="192px"
                className="h-6 w-auto object-contain opacity-70 grayscale"
              />
            </li>
          ) : null,
        )}
      </ul>
    </div>
  ) : null;

const HeroSection = ({
  layout,
  pretitle,
  content,
  ctas,
  image,
  productImage,
  bottomImage,
  logosTitle,
  logos,
  textAlign: ta = "center",
  alignItems: ai,
  ...props
}: HeroProps) => {
  const hasImage = !!image?.image;
  // Set by the `Sections` renderer on the page's first section only.
  const isFirstModule =
    (props as { "data-first-module"?: boolean })["data-first-module"] === true;

  if (stegaClean(layout) === "product-hero") {
    const hasProductImage = !!productImage?.image;

    return (
      <section
        className={cn(
          "relative isolate overflow-hidden",
          // Margin only: the frame owns the padding so the background image covers it.
          "[&[data-first-module=true]]:-mt-[var(--header-height)]",
          "3xl:[&[data-first-module=true]]:mt-0 3xl:[&[data-first-module=true]]:pt-12",
        )}
        // Read by the header via `:has()` in app.css; must match the 3xl breakpoint above.
        data-header-overlay="below-3xl"
        {...sectionProps(props)}
      >
        <div
          className={cn(
            "relative isolate overflow-hidden",
            "pt-16 pb-12 md:pt-24 md:pb-24",
            "[[data-first-module=true]_&]:pt-[calc(var(--header-height)+4rem)] md:[[data-first-module=true]_&]:pt-[calc(var(--header-height)+6rem)]",
            "3xl:mx-auto 3xl:max-w-[var(--width-container)] 3xl:rounded-2xl 3xl:py-20",
            "3xl:[[data-first-module=true]_&]:pt-20",
          )}
        >
          {hasImage && (
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
              <Image
                sanityImage={image}
                // 150vw oversamples: the exact-fit 1920w variant looks soft on a DPR-1 monitor.
                sizes="(min-width: 64rem) 150vw, 100vw"
                quality={85}
                className="object-cover"
                draggable={false}
                fill
                lqip={image.lqip}
                // Mobile LCP element: preload only on the first module.
                preload={isFirstModule || undefined}
                fetchPriority={isFirstModule ? "high" : undefined}
              />
            </div>
          )}

          <div className="section flex flex-col items-center text-center">
            <div className="flex max-w-3xl flex-col items-center gap-6">
              {content && (
                <div className="richtext text-balance">
                  {pretitle && <p className="pretitle">{pretitle}</p>}
                  <RichText value={content} />
                </div>
              )}

              {ctas?.length ? (
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                  <HeroCtas
                    ctas={ctas}
                    buttonClassName="[&_.icon-container]:!text-10 [&_.icon-container]:opacity-60"
                  />
                </div>
              ) : null}
            </div>

            {logos?.length ? (
              <div className="mt-12">
                <HeroLogos logosTitle={logosTitle} logos={logos} />
              </div>
            ) : null}

            {hasProductImage && (
              <div className="relative mt-12 -mb-16 aspect-video w-full max-w-5xl min-w-[var(--hero-product-mobile-width)] self-start overflow-hidden rounded-lg border border-foreground/10 sm:mb-0 sm:min-w-0 sm:self-center 3xl:max-w-4xl">
                <Image
                  sanityImage={productImage}
                  // 2048px oversamples the ~1024px frame so DPR-1 monitors look as sharp as retina.
                  sizes="(max-width: 64rem) 100vw, 2048px"
                  quality={85}
                  className="object-cover"
                  draggable={false}
                  fill
                />
              </div>
            )}
          </div>

          {/* Inside the frame, so it is clipped to the card's rounded corners at 3xl. */}
          <HeroBottomImage bottomImage={bottomImage} />
        </div>
      </section>
    );
  }

  const textAlign = stegaClean(ta);
  const alignItems = stegaClean(ai);

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        hasImage && "grid size-full overflow-hidden text-white",
        hasImage &&
          "h-[var(--hero-height)] sm:h-[var(--hero-height-sm)] md:h-[var(--hero-height-md)] lg:h-[var(--hero-height-lg)]",
        "pt-5 lg:pt-10 [&[data-first-module=true]]:-mt-[var(--header-height)] [&[data-first-module=true]]:pt-[calc(var(--header-height)+1.25rem)] md:[&[data-first-module=true]]:pt-[calc(var(--header-height)+1.25rem)]",
        "pb-5 lg:pb-10",
      )}
      data-header-overlay="always"
      {...sectionProps(props)}
    >
      {hasImage && (
        <>
          <Image
            sanityImage={image}
            // 150vw oversamples on desktop (see the product-hero backdrop).
            sizes="(min-width: 64rem) 150vw, 100vw"
            quality={90}
            className="object-cover"
            draggable={false}
            fill
            lqip={image.lqip}
            preload={isFirstModule || undefined}
            fetchPriority={isFirstModule ? "high" : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </>
      )}

      {content && (
        <div className="section flex flex-col text-balance">
          <div
            className={cn(
              "richtext relative isolate max-w-xl",
              hasImage && "text-shadow",
              {
                "mb-8": alignItems === "start",
                "my-auto": alignItems === "center",
                "mt-auto": alignItems === "end",
                "me-auto": ["left", "start"].includes(textAlign),
                "mx-auto": textAlign === "center",
                "ms-auto": ["right", "end"].includes(textAlign),
                "text-left": textAlign === "left",
                "text-center": textAlign === "center",
                "text-right": textAlign === "right",
                "text-justify": textAlign === "justify",
              },
            )}
          >
            <p className="pretitle text-white/70">{pretitle}</p>

            <RichText value={content} className="text-white [&_strong]:text-white" />
            <div
              className={cn(
                "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-[.5em] md:gap-4",
                "!mt-4",
                {
                  "items-start sm:justify-start": textAlign === "left",
                  "items-center sm:justify-center": textAlign === "center",
                  "items-end sm:justify-end": textAlign === "right",
                },
              )}
            >
              <HeroCtas ctas={ctas} />
            </div>
          </div>
        </div>
      )}

      <HeroBottomImage bottomImage={bottomImage} />
    </section>
  );
};

export default HeroSection;
