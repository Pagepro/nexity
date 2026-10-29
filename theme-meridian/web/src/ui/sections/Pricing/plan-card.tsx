import { Check } from "lucide-react";

import { ButtonLink } from "@/ui/components/button/button-link";

import { PlanPrice } from "./client-lazy";
import { Plan } from "./types";

interface PlanCardProps {
  plan: Plan;
}

export const PlanCard = ({ plan }: PlanCardProps) => {
  const {
    name,
    description,
    monthlyPrice,
    yearlyPrice,
    priceSuffix,
    badge,
    cta,
    featuresTitle,
    features,
  } = plan;

  return (
    // On lg the card is a subgrid over the parent's 4 row tracks so regions line up
    // across cards; every region is always rendered so an empty one keeps its track.
    <div className="card-frame flex h-full flex-col gap-6 overflow-hidden rounded-lg border-4 border-card-muted bg-background p-6 shadow-card lg:row-span-4 lg:grid lg:grid-rows-subgrid lg:gap-6">
      {badge && (
        <div className="absolute top-0 right-0 rounded-bl-lg border-b border-l border-border bg-muted px-4 py-2 text-12 font-medium text-foreground">
          {badge}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-16 font-medium text-foreground">{name}</p>
        {description && <p className="text-14 text-muted-foreground">{description}</p>}
      </div>

      <PlanPrice
        monthlyPrice={monthlyPrice}
        yearlyPrice={yearlyPrice}
        priceSuffix={priceSuffix}
      />

      <div>
        {cta?.link && (
          <ButtonLink
            className="block w-full"
            buttonClassName="w-full"
            {...cta}
            variant={cta.variant || undefined}
            link={cta.link}
          >
            {typeof cta.link === "string" ? cta.link : cta.link.label}
          </ButtonLink>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-3">
        {features?.length ? (
          <>
            {featuresTitle && (
              <p className="text-14 font-medium text-muted-foreground">{featuresTitle}</p>
            )}
            <ul className="flex flex-col gap-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="size-5 shrink-0 text-foreground" aria-hidden />
                  <span className="text-14 text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
};
