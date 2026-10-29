import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { ButtonLink } from "@/ui/components/button/button-link";
import Image from "@/ui/components/image";

import { Plan } from "./types";

interface PlanHeaderCellProps {
  plan: Plan;
  featured: boolean;
}

export const PlanHeaderCell = ({ plan, featured }: PlanHeaderCellProps) => {
  const { name, logo, price, priceSuffix, cta } = plan;

  return (
    <th
      scope="col"
      className={cn(
        // top-(--header-height), not top-0, or the row hides behind the fixed navbar; z-10 stays under its z-50.
        "sticky top-(--header-height) z-10 border-b border-border bg-background p-4 text-left align-top",
        featured && "bg-card-muted",
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          {logo?.image ? (
            <Image
              sanityImage={logo}
              sizes="16px"
              className="size-4 shrink-0 object-contain"
            />
          ) : (
            featured && (
              <Star
                className="size-4 shrink-0 fill-current text-foreground"
                aria-hidden
              />
            )
          )}
          <span className="text-16 font-medium text-foreground">{name}</span>
        </div>

        {price && (
          <div className="flex items-end gap-0.5">
            <span className="text-24 leading-none font-medium text-foreground">
              {price}
            </span>
            {priceSuffix && (
              <span className="text-14 leading-none text-muted-foreground">
                {priceSuffix}
              </span>
            )}
          </div>
        )}

        {cta?.link && (
          <ButtonLink
            className="block w-full"
            buttonClassName="w-full"
            {...cta}
            size="sm"
            variant={cta.variant || undefined}
            link={cta.link}
          >
            {typeof cta.link === "string" ? cta.link : cta.link.label}
          </ButtonLink>
        )}
      </div>
    </th>
  );
};
