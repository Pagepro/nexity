import { defineQuery } from "groq";

import { LINK_FRAGMENT } from "./link";

export const CTA_FRAGMENT = `
_type,
_key,
variant,
buttonIcon,
link { ${LINK_FRAGMENT} },
`;

export const CTAQuery = defineQuery(`*[_type == "internal.typeSource"][0] {
  cta {
    ${CTA_FRAGMENT}
  }
}.cta`);
