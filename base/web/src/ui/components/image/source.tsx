import { stegaClean } from "next-sanity";
import { getImageProps } from "next/image";
import { preload } from "react-dom";

import { SourceProps } from "./types";
import { generateSrc } from "./utils";

const Source: React.FC<SourceProps> = ({
  image,
  media = "(width < 48rem)",
  width: w,
  height: h,
  fill,
  quality,
  ...props
}) => {
  const { src, width, height } = generateSrc(image, w, h);
  const { props: imageProps } = getImageProps({
    src,
    width,
    height,
    quality,
    alt: "",
  });

  if (stegaClean(imageProps.loading) === "eager") {
    preload(imageProps.src, { as: "image" });
  }

  return (
    <source
      srcSet={imageProps.srcSet}
      width={fill ? undefined : imageProps.width}
      height={fill ? undefined : imageProps.height}
      media={media}
      sizes={props.sizes || "100vw"}
      {...props}
    />
  );
};

export default Source;
