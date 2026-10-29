import { ButtonLink } from "@/ui/components/button/button-link";
import RichText from "@/ui/RichText";

import { SubscribeBandProps } from "./types";

const SubscribeBand: React.FC<SubscribeBandProps> = ({
  heading,
  ctas,
  hidden = false,
}) => {
  if (hidden) return null;

  const hasHeading = heading && heading.length > 0;
  const hasCtas = ctas && ctas.length > 0;

  if (!hasHeading && !hasCtas) return null;

  return (
    <div className="flex flex-col gap-8 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
      {hasHeading && (
        <div className="richtext mx-auto max-w-xl text-balance lg:mx-0">
          <RichText value={heading} />
        </div>
      )}

      {hasCtas && (
        <div className="flex flex-col items-center gap-3 lg:flex-row lg:flex-wrap">
          {ctas.map((cta) =>
            cta.link ? (
              <ButtonLink
                key={cta._key}
                {...cta}
                variant={cta.variant || undefined}
                link={cta.link}
                size="md"
              >
                {cta.link.label}
              </ButtonLink>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
};

export default SubscribeBand;
