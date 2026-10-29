import { stegaClean } from "next-sanity";
import { Fragment } from "react";

import { FeatureAccordion, FeatureHint } from "./client-lazy";
import { ComparisonCell } from "./comparison-cell";
import { PlanHeaderCell } from "./plan-header-cell";
import { FeatureGroup, Plan } from "./types";

interface ComparisonGridProps {
  plans: Plan[];
  groups: FeatureGroup[];
}

export const ComparisonGrid = ({ plans, groups }: ComparisonGridProps) => {
  const columnCount = plans.length + 1;
  const featuredFlags = plans.map((plan) => stegaClean(plan.featured) === "featured");

  return (
    <div className="w-full">
      <FeatureAccordion plans={plans} groups={groups} />

      {/* No overflow-x wrapper: it computes overflow-y:auto and breaks the sticky header row. */}
      <table className="hidden w-full table-fixed border-collapse md:table">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky top-(--header-height) z-10 w-1/4 border-b border-border bg-background"
            >
              <span className="sr-only">Feature</span>
            </th>
            {plans.map((plan, index) => (
              <PlanHeaderCell
                key={plan._key}
                plan={plan}
                featured={featuredFlags[index]}
              />
            ))}
          </tr>
        </thead>

        <tbody>
          {groups.map((group) => (
            <Fragment key={group._key}>
              {(group.title || group.description) && (
                <tr>
                  <td
                    colSpan={columnCount}
                    className="border-b border-border pt-10 pb-3 text-left"
                  >
                    <span className="text-16 font-medium text-foreground">
                      {group.title}
                    </span>
                    {group.description && (
                      <span className="mt-1 block text-14 text-muted-foreground">
                        {group.description}
                      </span>
                    )}
                  </td>
                </tr>
              )}

              {group.rows?.map((row) => (
                <tr key={row._key}>
                  <th
                    scope="row"
                    className="border-b border-border py-3 pr-4 text-left text-14 font-normal text-foreground"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {row.label}
                      {row.hint && <FeatureHint hint={row.hint} />}
                    </span>
                  </th>
                  {plans.map((plan, index) => (
                    <ComparisonCell
                      key={plan._key}
                      cell={row.cells?.[index]}
                      featured={featuredFlags[index]}
                    />
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
