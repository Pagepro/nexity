import { Fragment } from "react";

export interface Metric {
  value?: string | null;
  label?: string | null;
}

interface MetricsCardProps {
  metrics: Metric[];
}

export const MetricsCard = ({ metrics }: MetricsCardProps) => (
  <div className="rounded-lg border border-border bg-muted p-6">
    <div className="flex flex-col gap-6 sm:flex-row sm:gap-0">
      {metrics.map((metric, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <div className="hidden w-px self-stretch bg-border sm:block" aria-hidden />
          )}
          <div className="flex flex-1 flex-col gap-3 text-center sm:px-5">
            <p className="text-30 leading-tight font-medium tracking-tight text-foreground md:text-36">
              {metric.value}
            </p>
            <p className="text-16 text-muted-foreground">{metric.label}</p>
          </div>
        </Fragment>
      ))}
    </div>
  </div>
);
