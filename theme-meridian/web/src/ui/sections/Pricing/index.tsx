import sectionProps from "@/lib/sectionProps";
import RichText from "@/ui/RichText";

import { PricingPlans } from "./client-lazy";
import { PlanCard } from "./plan-card";
import { PricingProps } from "./types";

const Pricing = ({
  pretitle,
  content,
  monthlyLabel,
  yearlyLabel,
  plans,
  footnote,
  ...props
}: PricingProps) => {
  if (!plans?.length) {
    return null;
  }

  return (
    <section className="bg-section-surface py-12 md:py-24" {...sectionProps(props)}>
      <div className="section flex flex-col items-center gap-8 md:gap-12">
        {(pretitle || content) && (
          <div className="flex max-w-xl flex-col items-center gap-4 text-center text-balance">
            {pretitle && <p className="pretitle">{pretitle}</p>}
            {content && <RichText value={content} />}
          </div>
        )}

        <PricingPlans
          hasYearlyPricing={plans.some((plan) => !!plan.yearlyPrice)}
          monthlyLabel={monthlyLabel}
          yearlyLabel={yearlyLabel}
        >
          <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-3 lg:gap-8">
            {plans.map((plan) => (
              <PlanCard key={plan._key} plan={plan} />
            ))}
          </div>

          {footnote && (
            <p className="text-center text-14 text-muted-foreground">{footnote}</p>
          )}
        </PricingPlans>
      </div>
    </section>
  );
};

export default Pricing;
