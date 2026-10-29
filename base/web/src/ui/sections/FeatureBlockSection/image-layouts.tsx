import { cn } from "@/lib/utils";
import Image from "@/ui/components/image";

import { FeatureBlockProps } from "./types";

type ImageLayoutProps = {
  images: NonNullable<FeatureBlockProps["images"]>;
};

export const HeroOverlapLayout = ({ images }: ImageLayoutProps) => {
  const [heroImage, ...overlayImages] = images;

  return (
    <div className="relative">
      {heroImage && (
        <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[2/1]">
          <Image sanityImage={heroImage} fill className="object-cover" sizes="100vw" />
        </div>
      )}

      {overlayImages.length > 0 && (
        <div className="relative mx-4 -mt-16 grid grid-cols-1 gap-4 sm:mx-8 sm:-mt-24 sm:grid-cols-2 lg:-mt-32">
          {overlayImages.map((image, index) => (
            <div
              key={image._key}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-lg border border-border shadow-md",
                index > 0 && "hidden sm:block",
              )}
            >
              <Image
                sanityImage={image}
                fill
                className="object-cover"
                sizes="(min-width: 640px) 50vw, 100vw"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const GridLayout = ({ images }: ImageLayoutProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {images.map((image) => (
      <div key={image._key} className="relative aspect-[4/3] overflow-hidden">
        <Image
          sanityImage={image}
          fill
          className="object-cover"
          sizes="(min-width: 640px) 50vw, 100vw"
        />
      </div>
    ))}
  </div>
);

export const SingleImageLayout = ({ images }: ImageLayoutProps) => {
  const image = images[0];

  if (!image) return null;

  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-background/10 shadow-2xl">
      <Image sanityImage={image} fill className="object-cover" sizes="100vw" />
    </div>
  );
};
