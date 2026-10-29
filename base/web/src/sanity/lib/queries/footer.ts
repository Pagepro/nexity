import { defineQuery } from "groq";

import { missingDocumentError } from "@/lib/errors";
import type { FooterQueryResult } from "@/types/sanity.types";

import { fetchSanity } from "../fetch";
import { CTA_FRAGMENT } from "../fragments/cta";
import { IMAGE_FRAGMENT } from "../fragments/image";
import { LINK_FRAGMENT } from "../fragments/link";
import { SANITY_TAGS } from "../tags";

const FooterQuery = defineQuery(`
*[_type == 'footer'][0] {
  subscribeHeading,
  subscribeCtas[] { ${CTA_FRAGMENT} },
  subscribeExcludePaths,
  social[] { ${LINK_FRAGMENT} },
  navigation[] {
    _key,
    title,
    links[] { ${LINK_FRAGMENT} }
  },
  wordmark { ${IMAGE_FRAGMENT} }
}
`);

export const getFooter = async () => {
  const footer = await fetchSanity<FooterQueryResult>({
    query: FooterQuery,
    tags: [SANITY_TAGS.footer],
  });

  if (!footer) {
    throw missingDocumentError("Footer settings");
  }

  return footer;
};
