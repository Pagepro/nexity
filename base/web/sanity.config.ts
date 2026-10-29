"use client";

import { createSanityConfig } from "@nexity/studio/config";

import resolveUrl from "@/lib/resolveUrl";
import { projectId, dataset, apiVersion } from "@/sanity/lib/env";

export default createSanityConfig({
  projectId,
  dataset,
  apiVersion,
  basePath: "/admin",
  productionUrl: async (prev, { document }) => {
    if (["page"].includes(document?._type)) {
      return resolveUrl(document, { base: true });
    }

    return prev;
  },
});
