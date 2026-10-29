import { type QueryOptions, type QueryParams } from "next-sanity";

import { client } from "@/sanity/lib/client";
import { GLOBAL_TAG, requestTagFor } from "@/sanity/lib/tags";

const PUBLISHED_REVALIDATE = 3600 * 24 * 30;

const publishedClient = client.withConfig({ stega: false });

// Never reads `draftMode()` and keeps stega off: text that leaves the site (the Markdown
// route) must be published content without invisible characters.
export async function fetchPublished<T = unknown>({
  query,
  params = {},
  tags,
  next,
}: {
  query: string;
  params?: Partial<QueryParams>;
  tags?: string[];
  next?: QueryOptions["next"];
}): Promise<T> {
  return publishedClient.fetch<T>(query, params, {
    perspective: "published",
    useCdn: true,
    tag: requestTagFor(tags),
    next: {
      revalidate: PUBLISHED_REVALIDATE,
      ...next,
      tags: [GLOBAL_TAG, ...(tags ?? []), ...(next?.tags ?? [])],
    },
  });
}
