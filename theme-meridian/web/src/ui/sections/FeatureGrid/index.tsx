import sectionProps from "@/lib/sectionProps";
import RichText from "@/ui/RichText";

import { FeatureCard } from "./feature-card";
import { FeatureGridProps } from "./types";
import { toFeatureCard } from "./utils";

const FeatureGrid = ({ pretitle, content, cards, ...props }: FeatureGridProps) => {
  const items = (cards ?? []).flatMap((item) => {
    const card = toFeatureCard(item);
    return card ? [{ key: item._key, card }] : [];
  });

  if (!items.length) {
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

        <div className="grid w-full gap-6 md:grid-cols-3 md:gap-8">
          {items.map(({ key, card }, index) => (
            <FeatureCard key={key} card={card} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
