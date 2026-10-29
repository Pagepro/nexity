import { urlFor } from "@/sanity/lib/image";
import { ImageFragment } from "@/types/fragments";
import { isSvgAsset } from "@/ui/components/image/utils";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

export const toOgImage = (
  imageObject: Pick<ImageFragment, "alt" | "image"> | null | undefined,
) => {
  if (!imageObject?.image?.asset) {
    return undefined;
  }

  const builder = urlFor(imageObject.image)
    .width(OG_WIDTH)
    .height(OG_HEIGHT)
    .fit("crop")
    .quality(80);

  return {
    // Social crawlers don't render SVG.
    url: (isSvgAsset(imageObject.image) ? builder.format("png") : builder).url(),
    width: OG_WIDTH,
    height: OG_HEIGHT,
    alt: imageObject.alt || imageObject.image.asset.altText || undefined,
  };
};
