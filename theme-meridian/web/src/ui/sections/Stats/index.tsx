import { stegaClean } from "next-sanity";

import sectionProps from "@/lib/sectionProps";
import { cn } from "@/lib/utils";
import RichText from "@/ui/RichText";

import { StatsProps } from "./types";

const BAND_COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

const Stats = ({ layout, textAlign, content, stats, ...props }: StatsProps) => {
  if (!stats?.length) {
    return null;
  }

  if (stegaClean(layout) === "band") {
    const isCentered = stegaClean(textAlign) === "center";

    return (
      <section className="py-8 md:py-12" {...sectionProps(props)}>
        <div className="section">
          <dl
            className={cn(
              "grid gap-px border-y border-border bg-border",
              BAND_COLUMNS[stats.length] ?? BAND_COLUMNS[4],
              isCentered && "mx-auto max-w-4xl",
            )}
          >
            {stats.map((stat) => (
              <div
                key={stat._key}
                className={cn(
                  "flex flex-col-reverse gap-2 bg-background p-6",
                  isCentered && "items-center text-center",
                )}
              >
                <dt className="text-14 text-muted-foreground">{stat.label}</dt>
                <dd className="text-30 leading-tight font-medium tracking-tight text-foreground md:text-36">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-section-surface py-12 md:py-24" {...sectionProps(props)}>
      <div className="section flex flex-col gap-8 md:flex-row md:items-start md:gap-16">
        {content && (
          <div className="richtext flex-1 text-balance">
            <RichText value={content} />
          </div>
        )}

        <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 sm:gap-y-12">
          {stats.map((stat) => (
            <div
              key={stat._key}
              className="flex flex-col gap-2 border-l-2 border-border pl-4 md:gap-4 md:pl-6"
            >
              <p className="text-30 leading-tight font-medium tracking-tight text-foreground md:text-36">
                {stat.value}
              </p>
              <p className="text-16 text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
