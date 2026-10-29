import { defineQuery } from "groq";

import { METADATA_FRAGMENT } from "@/sanity/lib/fragments/metadata";
import { STRUCTURED_DATA_FRAGMENT } from "@/sanity/lib/fragments/structured-data";
import { SECTIONS_QUERY } from "@/sanity/lib/queries";

export const PageQuery = defineQuery(`*[
    _type == 'page'
    && metadata.slug.current == $slug
  ][0]{
    ...,
    'sections': sections[]{ ${SECTIONS_QUERY} },
    metadata {
      ${METADATA_FRAGMENT}
    },
    ${STRUCTURED_DATA_FRAGMENT},
  }`);
