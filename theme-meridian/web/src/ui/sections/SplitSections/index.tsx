import sectionProps from "@/lib/sectionProps";

import { SplitRow } from "./split-row";
import { SplitSectionsProps } from "./types";

const SplitSections = ({ rows, ...props }: SplitSectionsProps) => {
  if (!rows?.length) {
    return null;
  }

  return (
    <section className="py-12 md:py-24" {...sectionProps(props)}>
      <div className="section flex flex-col gap-12 md:gap-24">
        {rows.map((row, index) => (
          <SplitRow key={row._key} row={row} index={index} />
        ))}
      </div>
    </section>
  );
};

export default SplitSections;
