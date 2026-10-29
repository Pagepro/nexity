import { defineQuery } from "groq";

import { METADATA_FRAGMENT } from "@/sanity/lib/fragments/metadata";
import { SECTIONS_QUERY } from "@/sanity/lib/queries";

export const NotFoundQuery =
  defineQuery(`*[_type == 'page' && metadata.slug.current == '404'][0]{
    ...,
    'sections': sections[]{ ${SECTIONS_QUERY} },
    metadata {
      ${METADATA_FRAGMENT}
    },
  }`);
