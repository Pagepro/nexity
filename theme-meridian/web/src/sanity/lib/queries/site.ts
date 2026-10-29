import { defineQuery } from "groq";

import { missingDocumentError } from "@/lib/errors";
import { readSiteSchema } from "@/lib/schema-org/build-graph";
import type { SiteSchemaData } from "@/lib/schema-org/types";
import type { SiteQueryResult, SiteSchemaQueryResult } from "@/types/sanity.types";

import { fetchSanity } from "../fetch";
import { IMAGE_FRAGMENT } from "../fragments/image";
import { SITE_STRUCTURED_DATA_FRAGMENT } from "../fragments/structured-data";
import { SANITY_TAGS } from "../tags";

const SiteQuery = defineQuery(`
*[_type == 'site'][0] {
  title,
  logo {
    ${IMAGE_FRAGMENT}
  },
  seo {
    title,
    description,
    image {
      ${IMAGE_FRAGMENT}
    }
  }
}
`);

export const getSite = async () => {
  const site = await fetchSanity<SiteQueryResult>({
    query: SiteQuery,
    tags: [SANITY_TAGS.site],
  });

  if (!site) {
    throw missingDocumentError("Site settings");
  }

  return site;
};

const SiteSchemaQuery = defineQuery(`*[_type == 'site'][0] {
  ${SITE_STRUCTURED_DATA_FRAGMENT}
}`);

/** Unlike `getSite()` it never throws: `null` drops the organization nodes instead of failing the build. */
export const getSiteSchema = (): Promise<SiteSchemaData | null> =>
  readSiteSchema(() =>
    fetchSanity<SiteSchemaQueryResult>({
      query: SiteSchemaQuery,
      tags: [SANITY_TAGS.site],
    }),
  );
