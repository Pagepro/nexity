import { Check, X } from "lucide-react";

import { SplitRow } from "./types";

interface RowComparisonProps {
  comparison: NonNullable<SplitRow["comparison"]>;
}

export const RowComparison = ({ comparison }: RowComparisonProps) => {
  const { beforeTitle, beforeItems, afterTitle, afterItems } = comparison;

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-6">
      <div className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6">
        {beforeTitle && (
          <p className="flex items-center gap-3 text-16 font-medium text-muted-foreground">
            <span className="flex size-6 items-center justify-center rounded-full bg-muted">
              <X className="size-3.5" aria-hidden />
            </span>
            {beforeTitle}
          </p>
        )}
        {beforeItems?.length ? (
          <ul className="flex flex-col gap-3 text-14">
            {beforeItems.map((item, itemIndex) => (
              <li
                key={`${itemIndex}-${item}`}
                className="flex items-center gap-3 text-muted-foreground"
              >
                <X className="size-3.5 shrink-0" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="card-frame flex flex-col gap-5 overflow-hidden rounded-lg border-4 border-background bg-card-muted p-6 shadow-card">
        {afterTitle && (
          <p className="flex items-center gap-3 text-16 font-medium text-foreground">
            <span className="flex size-6 items-center justify-center rounded-full bg-accent-peach dark:bg-accent-peach/20">
              <Check className="size-3.5" aria-hidden />
            </span>
            {afterTitle}
          </p>
        )}
        {afterItems?.length ? (
          <ul className="flex flex-col gap-3 text-14">
            {afterItems.map((item, itemIndex) => (
              <li
                key={`${itemIndex}-${item}`}
                className="flex items-center gap-3 text-foreground"
              >
                <Check className="size-3.5 shrink-0 text-foreground" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
};
