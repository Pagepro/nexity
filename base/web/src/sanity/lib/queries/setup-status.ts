import { defineQuery } from "groq";

import type { SetupStatusQueryResult } from "@/types/sanity.types";

import { fetchSanity } from "../fetch";
import { SANITY_TAGS } from "../tags";

// Until all of these documents exist, the layout renders the Next steps screen
// (`ui/getting-started`) instead of the site.
const SetupStatusQuery = defineQuery(`{
  "hasSite": defined(*[_type == "site"][0]._id),
  "hasHeader": defined(*[_type == "header"][0]._id),
  "hasFooter": defined(*[_type == "footer"][0]._id),
  "hasHomepage": defined(*[_type == "page" && metadata.slug.current == "/"][0]._id)
}`);

export type SetupStatus = SetupStatusQueryResult & { isComplete: boolean };

export const getSetupStatus = async (): Promise<SetupStatus> => {
  const status = await fetchSanity<SetupStatusQueryResult>({
    query: SetupStatusQuery,
    tags: [SANITY_TAGS.site, SANITY_TAGS.header, SANITY_TAGS.footer, SANITY_TAGS.page],
  });

  return {
    ...status,
    isComplete:
      status.hasSite && status.hasHeader && status.hasFooter && status.hasHomepage,
  };
};
