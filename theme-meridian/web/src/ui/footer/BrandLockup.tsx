import { getImageProps } from "next/image";

import { cn } from "@/lib/utils";

import { BrandLockupProps } from "./types";

// Always the Meridian mark, not the CMS site title. A plain <img> from
// `getImageProps`: the `next/image` component is client code that would ship to
// every page for this one static file.
const BrandLockup: React.FC<BrandLockupProps> = ({ className }) => {
  const { props: imgProps } = getImageProps({
    src: "/meridian-logo.svg",
    alt: "",
    width: 328,
    height: 61,
    unoptimized: true,
    draggable: false,
    className: cn("pointer-events-none h-auto w-full select-none", className),
  });

  // oxlint-disable-next-line nextjs/no-img-element, jsx-a11y/alt-text
  return <img {...imgProps} aria-hidden />;
};

export default BrandLockup;
