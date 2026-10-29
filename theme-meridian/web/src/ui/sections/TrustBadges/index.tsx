import sectionProps from "@/lib/sectionProps";
import { FeatureIcon } from "@/ui/components/feature-icon";

import { TrustBadgesProps } from "./types";

const TrustBadges = ({ badges, ...props }: TrustBadgesProps) => {
  if (!badges?.length) {
    return null;
  }

  return (
    <section className="py-8 md:py-12" {...sectionProps(props)}>
      {/* `text-14` on the list so each badge's color-only classes never collide with it. */}
      <ul className="section flex flex-wrap items-center justify-center gap-y-4 text-14">
        {badges.map((badge) => (
          <li
            key={badge._key}
            className="flex items-center gap-2 border-border px-6 font-medium text-foreground not-last:sm:border-r md:px-8"
          >
            <FeatureIcon icon={badge.icon} className="size-4 text-muted-foreground" />
            {badge.label}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default TrustBadges;
