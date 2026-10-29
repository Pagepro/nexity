import { defineQuery } from "groq";

import { IMAGE_FRAGMENT } from "./image";

// Always interpolate this fragment: projecting metadata by hand silently breaks
// `seoTitle` / `canonical` / `noFollow` / `hreflang` on a route.
export const METADATA_FRAGMENT = `
  _type,
  slug,
  title,
  seoTitle,
  description,
  canonical,
  noIndex,
  noFollow,
  hreflang[] {
    hreflang,
    href
  },
  image {
    ${IMAGE_FRAGMENT}
  }
`;

export const MetadataQuery = defineQuery(`*[_type == "internal.typeSource"][0] {
  metadata { ${METADATA_FRAGMENT} }
}.metadata`);
