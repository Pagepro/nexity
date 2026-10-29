import clsx from "clsx";
import { stegaClean } from "next-sanity";
import NextImage, { getImageProps } from "next/image";
import { preload as preloadResource } from "react-dom";

import { toSameOriginCdnUrl } from "@/lib/sanity-cdn-proxy";

import Source from "./source";
import { ImageProps } from "./types";
import { generateSrc, isSvgAsset } from "./utils";

// No `placeholder="blur"`: its SVG blurs delay the first frame and its base64
// was a quarter of the homepage HTML. `lqip` opts one image back in cheaply.
const Image: React.FC<ImageProps> = ({
  sanityImage,
  width: w,
  height: h,
  fill,
  preload,
  priority,
  fetchPriority,
  quality = 80,
  alt,
  lqip,
  ...props
}) => {
  const { src, width, height } = generateSrc(sanityImage.image, w, h);
  const isSvg = isSvgAsset(sanityImage.image);

  const sanityLoading = stegaClean(sanityImage.loading);
  const loading = props.loading || sanityLoading || undefined;

  const sizes = props.sizes || (isSvg ? undefined : "100vw");
  // CMS "eager" must not preload: parallel preloads starve the real LCP image.
  // `loading` must be unset when preloading (Next rule).
  const shouldPreload = Boolean(preload || priority);
  // `alt=""` from code or a decorative role from the CMS beats the asset's alt text.
  const altText =
    alt ??
    (stegaClean(sanityImage.role) === "decorative"
      ? ""
      : sanityImage.alt || sanityImage.image?.asset?.altText || "");

  // Until hydration the LQIP stays painted under the image, so pass it only for opaque images.
  const lqipPlaceholder = lqip?.startsWith("data:image/")
    ? (lqip as `data:image/${string}`)
    : undefined;

  return (
    <picture
      className={clsx({
        "absolute block size-full": fill,
      })}
    >
      {sanityImage.responsive?.map((responsiveImage, key) => {
        if (!responsiveImage?.image) {
          return null;
        }

        return (
          <Source
            key={key}
            {...{ fill, sizes, quality }}
            image={responsiveImage.image}
            loading={shouldPreload ? undefined : loading}
          />
        );
      })}
      {isSvg ? (
        <SvgImage
          {...props}
          src={src}
          fill={fill}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          alt={altText}
          loading={shouldPreload ? undefined : loading}
          fetchPriority={fetchPriority}
          preload={shouldPreload}
        />
      ) : (
        <NextImage
          {...{ fill, sizes, quality, src }}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          alt={altText}
          placeholder={lqipPlaceholder}
          {...props}
          loading={shouldPreload ? undefined : loading}
          fetchPriority={fetchPriority}
          preload={shouldPreload}
        />
      )}
    </picture>
  );
};

// Plain <img> with the URL swapped after getImageProps: given a root-relative src,
// next/image appends `?dpl=<deployment id>` on Vercel, changing the cache key every deploy.
const SvgImage = ({
  src,
  preload,
  fetchPriority,
  ...props
}: Omit<ImageProps, "sanityImage" | "lqip"> & { src: string; alt: string }) => {
  const { props: svgProps } = getImageProps({
    ...props,
    src,
    fetchPriority,
    unoptimized: true,
  });
  const sameOriginSrc = toSameOriginCdnUrl(svgProps.src);

  if (preload) {
    preloadResource(sameOriginSrc, { as: "image", fetchPriority });
  }

  // oxlint-disable-next-line nextjs/no-img-element, jsx-a11y/alt-text -- alt comes from getImageProps
  return <img {...svgProps} src={sameOriginSrc} />;
};

export default Image;
