import sectionProps from "@/lib/sectionProps";
import { ButtonLink } from "@/ui/components/button/button-link";
import RichText from "@/ui/RichText";

import { IntegrationsGridClient } from "./client-lazy";
import { IntegrationsGridProps } from "./types";

const IntegrationsGrid = ({
  pretitle,
  content,
  allLabel,
  searchPlaceholder,
  emptyMessage,
  integrations,
  ctas,
  ...props
}: IntegrationsGridProps) => {
  if (!integrations?.length) {
    return null;
  }

  return (
    <section className="py-12 md:py-24" {...sectionProps(props)}>
      <div className="section flex flex-col items-center gap-8 md:gap-12">
        {(pretitle || content) && (
          <div className="flex max-w-xl flex-col items-center gap-4 text-center text-balance">
            {pretitle && <p className="pretitle">{pretitle}</p>}
            {content && <RichText value={content} />}
          </div>
        )}

        <IntegrationsGridClient
          integrations={integrations}
          allLabel={allLabel || "All"}
          searchPlaceholder={searchPlaceholder || "Search integrations"}
          emptyMessage={emptyMessage || "No integrations match your search."}
        />

        {ctas?.length ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
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

export default IntegrationsGrid;
