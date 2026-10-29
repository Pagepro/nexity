import { stegaClean } from "next-sanity";

import sectionProps from "@/lib/sectionProps";
import { ButtonLink } from "@/ui/components/button/button-link";
import Image from "@/ui/components/image";
import RichText from "@/ui/RichText";

import NewsletterForm from "./client-lazy";
import { NewsletterSectionProps } from "./types";

const NewsletterSection = ({
  layout,
  content,
  emailPlaceholder,
  submitLabel,
  successMessage,
  ctas,
  socialProof,
  backgroundImage,
  ...props
}: NewsletterSectionProps) => {
  if (stegaClean(layout) === "centered") {
    return (
      <section className="py-12 md:py-24" {...sectionProps(props)}>
        <div className="section flex flex-col items-center gap-8 text-center">
          {content && (
            <div className="richtext flex max-w-xl flex-col gap-4 text-balance">
              <RichText value={content} />
            </div>
          )}

          <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <div className="w-full sm:w-96">
              <NewsletterForm
                emailPlaceholder={emailPlaceholder}
                submitLabel={submitLabel}
                successMessage={successMessage}
              />
            </div>
            {ctas?.map((cta, key) =>
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

          {socialProof && (
            <div className="richtext">
              <RichText value={socialProof} />
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-24" {...sectionProps(props)}>
      <div className="section">
        <div className="relative overflow-hidden rounded-lg border border-border bg-background p-8 md:p-12">
          {backgroundImage?.image && (
            <div aria-hidden className="absolute inset-0 overflow-hidden">
              <Image
                sanityImage={backgroundImage}
                fill
                alt=""
                // 15% opacity texture: retina sharpness is invisible, so cap the request.
                sizes="600px"
                quality={75}
                className="object-cover opacity-15"
              />
            </div>
          )}

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            {content && (
              <div className="richtext flex flex-col gap-4 lg:max-w-2xl lg:flex-1">
                <RichText value={content} className="text-foreground" />
              </div>
            )}

            <div className="flex w-full flex-col gap-3 lg:w-100 lg:shrink-0">
              <NewsletterForm
                emailPlaceholder={emailPlaceholder}
                submitLabel={submitLabel}
                successMessage={successMessage}
              />
              {socialProof && (
                <div className="px-5.5 text-right">
                  <RichText value={socialProof} className="text-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
