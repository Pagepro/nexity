import { defineQuery } from "groq";

export const LINK_FRAGMENT = `
_type,
type,
external,
internalPath,
internal -> {
  _type,
  title,
  metadata { slug },
  slug
},
file {
  asset -> { url, label, originalFilename }
},
params,
label
`;

// Typegen-only query: MUST use defineQuery, and the field name must match
// `__type-source.ts` in the Studio, or LinkQueryResult disappears.
export const LinkQuery = defineQuery(`*[_type == "internal.typeSource"][0] {
  link { ${LINK_FRAGMENT} }
}.link`);
