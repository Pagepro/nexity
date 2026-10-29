"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { CellValue } from "./cell-value";
import { FeatureHint } from "./feature-hint";
import { FeatureGroup, Plan } from "./types";

interface FeatureAccordionProps {
  plans: Plan[];
  groups: FeatureGroup[];
}

export const FeatureAccordion = ({ plans, groups }: FeatureAccordionProps) => {
  const [openRows, setOpenRows] = useState<Set<string>>(() => new Set());

  const toggle = (key: string) =>
    setOpenRows((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

  return (
    <div className="flex flex-col gap-8 md:hidden">
      {groups.map((group) => (
        <div key={group._key} className="flex flex-col">
          {group.title && (
            <h3 className="text-18 font-medium text-foreground">{group.title}</h3>
          )}
          {group.description && (
            <p className="mt-1 text-14 text-muted-foreground">{group.description}</p>
          )}

          <div className={clsx("flex flex-col", group.title && "mt-4")}>
            {group.rows?.map((row) => {
              const isOpen = openRows.has(row._key);

              return (
                <div key={row._key} className="relative border-b border-border">
                  {/* Toggle sits behind the content: wrapping it would nest FeatureHint's <button> in a <button>. */}
                  <button
                    type="button"
                    onClick={() => toggle(row._key)}
                    aria-expanded={isOpen}
                    aria-label={row.label ?? undefined}
                    className="absolute inset-0 cursor-pointer"
                  />
                  <div className="pointer-events-none relative flex items-center justify-between gap-3 py-4">
                    <span className="flex items-center gap-1.5 text-14 font-medium text-foreground">
                      {row.label}
                      {row.hint && (
                        <span className="pointer-events-auto">
                          <FeatureHint hint={row.hint} />
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      className={clsx(
                        "size-5 shrink-0 text-muted-foreground transition-all",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </div>

                  {isOpen && (
                    <dl className="flex flex-col pb-4">
                      {plans.map((plan, index) => (
                        <div
                          key={plan._key}
                          className="grid grid-cols-2 items-center gap-4 border-t border-border py-3 first:border-t-0"
                        >
                          <dt className="text-14 text-muted-foreground">{plan.name}</dt>
                          <dd className="flex text-14 text-foreground">
                            <CellValue cell={row.cells?.[index]} />
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
