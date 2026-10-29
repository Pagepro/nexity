import { ImageProps as NextImageProps } from "next/image";

import { ImageFragment } from "@/types/fragments";

export interface ImageProps extends Omit<NextImageProps, "src" | "alt"> {
  sanityImage: ImageFragment;
  alt?: string;
  /** Only for opaque images: it stays painted under the image. */
  lqip?: string | null;
}

export interface SourceProps
  extends
    React.HTMLAttributes<HTMLSourceElement>,
    Pick<NextImageProps, "loading" | "sizes" | "width" | "height" | "fill" | "quality"> {
  image: ImageFragment["image"];
  media?: string;
}
