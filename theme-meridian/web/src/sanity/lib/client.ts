import { createClient } from "next-sanity";

import { projectId, dataset, apiVersion, readonlyToken } from "@/sanity/lib/env";

// Prefixes every site read in Sanity's request log, so it can be told apart from Studio and scripts.
export const REQUEST_TAG_PREFIX = "web";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  requestTagPrefix: REQUEST_TAG_PREFIX,
  useCdn: true,
  token: readonlyToken,
  stega: {
    studioUrl: "/admin",
  },
});

// Preview (draft) reads must not hit the CDN, which never serves fresh drafts.
export const previewClient = client.withConfig({ useCdn: false });
