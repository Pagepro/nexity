"use server";

import { type QueryOptions, type QueryParams } from "next-sanity";
import { defineLive } from "next-sanity/live";
import { draftMode } from "next/headers";

import { client, previewClient } from "@/sanity/lib/client";
import { GLOBAL_TAG, requestTagFor } from "@/sanity/lib/tags";
import { token, browserToken } from "@/sanity/lib/token";

const PUBLISHED_REVALIDATE = 3600 * 24 * 30;

// Editor-only: the Live Content API bills against api.sanity.io and opens a browser
// SSE stream, so it must run only in draft mode, never for public traffic.
export const { SanityLive } = defineLive({
  client: previewClient,
  serverToken: token,
  browserToken: browserToken,
});

// Preview (uncached `drafts` perspective) must be driven ONLY by draft mode —
// never by `dev`, or every local render hits the billed, uncached API.
const isPreview = async () => (await draftMode()).isEnabled;

export async function fetchSanity<T = unknown>({
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
  const preview = await isPreview();
  const tag = requestTagFor(tags);

  // Not defineLive's `sanityFetch`: it spends a second request on sync tags, which draft mode
  // never reads (its fetches skip the Data Cache and `<SanityLive includeDrafts>` refreshes).
  if (preview) {
    return previewClient.fetch<T>(query, params, {
      perspective: "drafts",
      stega: true,
      token,
      useCdn: false,
      tag,
    });
  }

  return client.fetch<T>(query, params, {
    perspective: "published",
    useCdn: true,
    tag,
    next: {
      revalidate: PUBLISHED_REVALIDATE,
      ...next,
      tags: [GLOBAL_TAG, ...(tags ?? []), ...(next?.tags ?? [])],
    },
  });
}
