import { cn } from "@/lib/utils";
import Image from "@/ui/components/image";
import { BaseLink } from "@/ui/components/Link/BaseLink";

import { ACCENT_MARKER_CLASSES } from "./constants";
import { FeatureCardData } from "./types";

interface FeatureCardProps {
  card: FeatureCardData;
  index: number;
}

export const FeatureCard = ({ card, index }: FeatureCardProps) => {
  const { label, title, image, link } = card;
  const markerClass = ACCENT_MARKER_CLASSES[index % ACCENT_MARKER_CLASSES.length];

  const content = (
    <>
      <div className="flex flex-col gap-3">
        {label && (
          <div className="flex items-center gap-2">
            <span className={`size-1.5 shrink-0 ${markerClass}`} aria-hidden />
            <p className="text-10 font-medium tracking-wider text-muted-foreground uppercase">
              {label}
            </p>
          </div>
        )}
        {title && (
          <p className="text-18 leading-snug font-medium text-balance text-foreground">
            {title}
          </p>
        )}
      </div>

      {image?.image && (
        <div className="relative mt-auto aspect-[4/3] w-full overflow-hidden rounded-lg">
          <Image
            sanityImage={image}
            // Card width minus gutters, 4px frame and p-6: update with the grid layout.
            sizes="(min-width: 80rem) 20rem, (min-width: 48rem) calc((100vw - 8rem) / 3 - 3.5rem), calc(100vw - 6rem)"
            className="object-cover"
            fill
          />
        </div>
      )}
    </>
  );

  // Frame stays on the wrapper: a link that resolves to nothing makes BaseLink render bare children.
  return (
    <div
      className={cn(
        "card-frame flex h-full flex-col overflow-hidden rounded-lg border-4 border-background bg-card shadow-card",
        link && "transition-shadow hover:shadow-xl",
      )}
    >
      {link ? (
        <BaseLink link={link} className="flex flex-1 flex-col gap-6 p-6">
          {content}
        </BaseLink>
      ) : (
        <div className="flex flex-1 flex-col gap-6 p-6">{content}</div>
      )}
    </div>
  );
};
