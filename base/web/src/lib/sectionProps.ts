import { stegaClean } from "next-sanity";

import { SectionOptions } from "@/types/sanity.types";

import { dev } from "./env";

// Everything else in `props` is GROQ section data; spreading it would leak CMS fields onto
// the DOM ("React does not recognize the `x` prop").
const isDomAttribute = (key: string) =>
  key.startsWith("data-") || key.startsWith("aria-");

export default function sectionProps({
  _type,
  options,
  _key,
  ...props
}: {
  _type?: string;
  _key?: string;
  options?: SectionOptions;
}) {
  const domAttributes = Object.fromEntries(
    Object.entries(props).filter(([key]) => isDomAttribute(key)),
  );

  return {
    id: stegaClean(options?.uid) || "section-" + _key,
    "data-section": _type,
    hidden: !dev && options?.hidden,
    ...domAttributes,
    // Sections have no Sanity field of their own, so they can't be selected in the visual editor.
    "data-sanity": undefined,
  };
}
