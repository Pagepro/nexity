import { getImageDimensions } from "@sanity/asset-utils";

import { urlFor } from "@/sanity/lib/image";
import { ImageFragment } from "@/types/fragments";

// Next's largest default `deviceSizes` entry: capping the source here never starves a 2× render.
const MAX_SOURCE_WIDTH = 3840;

export const generateSrc = (
  image: ImageFragment["image"],
  w?: number | `${number}` | string,
  h?: number | `${number}` | string,
): { src: string; width: number; height: number } => {
  if (!image?.asset) {
    throw new Error("Image asset is missing");
  }

  const { width: w_orig, height: h_orig } = getImageDimensions(image.asset);

  const w_calc = !!w ? Number(w) : !!h && Math.floor((Number(h) * w_orig) / h_orig);

  const h_calc = !!h ? Number(h) : !!w && Math.floor((Number(w) * h_orig) / w_orig);

  const builder = urlFor(image);
  const src = (
    w_orig > MAX_SOURCE_WIDTH ? builder.width(MAX_SOURCE_WIDTH).fit("max") : builder
  ).url();

  return {
    src,
    width: w_calc || w_orig,
    height: h_calc || h_orig,
  };
};

// Sanity asset refs end with the file extension: `image-<id>-<w>x<h>-svg`.
export const isSvgAsset = (image: ImageFragment["image"]): boolean => {
  const asset = image?.asset as { _ref?: string; _id?: string; url?: string } | undefined;
  const id = asset?._ref || asset?._id || asset?.url || "";

  return id.endsWith("-svg") || id.endsWith(".svg");
};
