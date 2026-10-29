import sectionProps from "@/lib/sectionProps";
import RichText from "@/ui/RichText";

import { ComparisonGrid } from "./comparison-grid";
import { ComparisonTableProps } from "./types";

const ComparisonTable = ({
  pretitle,
  content,
  plans,
  featureGroups,
  footnote,
  ...props
}: ComparisonTableProps) => {
  if (!plans?.length || !featureGroups?.length) {
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

        <ComparisonGrid plans={plans} groups={featureGroups} />

        {footnote && <p className="w-full text-14 text-muted-foreground">{footnote}</p>}
      </div>
    </section>
  );
};

export default ComparisonTable;
