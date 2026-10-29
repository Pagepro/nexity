import { defineQuery } from "groq";
import { createClient } from "next-sanity";

import {
  REDIRECT_TTL_SECONDS,
  type RedirectEntry,
  type RewriteEntry,
} from "@/lib/redirect-map";
import resolveUrl from "@/lib/resolveUrl";
import { REQUEST_TAG_PREFIX } from "@/sanity/lib/client";
import { projectId, dataset, apiVersion, readonlyToken } from "@/sanity/lib/env";
import { GLOBAL_TAG, SANITY_TAGS } from "@/sanity/lib/tags";
import type { RedirectQueryResult, RewriteQueryResult } from "@/types/sanity.types";
import { internalPathHref } from "@/ui/components/Link/BaseLink/utils";

// Own client, not `fetchSanity`: that one follows `draftMode()` (an editor would get DRAFT
// redirects), and stega must be off or its invisible characters break the `Location` header.
const client = createClient({
  projectId,
  dataset,
  apiVersion,
  requestTagPrefix: REQUEST_TAG_PREFIX,
  useCdn: true,
  token: readonlyToken,
  stega: false,
});

// Project the raw link, not a path: the path is built in code with `BaseLink`'s helpers so a
// `post` or `case-study` destination gets its route prefix.
export const RedirectQuery = defineQuery(`*[_type == 'redirect' && defined(source)]{
    source,
    permanent,
    destination {
      type,
      external,
      internalPath,
      params,
      internal -> { _type, metadata { slug } },
      "fileUrl": file.asset->url
    }
  }`);

export const RewriteQuery = defineQuery(`*[_type == 'rewrite' && defined(source)]{
    source,
    destination {
      type,
      external,
      internalPath,
      params,
      internal -> { _type, metadata { slug } },
      "fileUrl": file.asset->url
    }
  }`);

type RedirectDestination =
  | NonNullable<RedirectQueryResult[number]["destination"]>
  | NonNullable<RewriteQueryResult[number]["destination"]>;

export const resolveRedirectDestination = (
  destination: RedirectDestination | null,
): string | null => {
  switch (destination?.type) {
    case "internal":
      return destination.internal
        ? resolveUrl(destination.internal, { base: false, params: destination.params }) ||
            null
        : null;
    case "path":
      return internalPathHref(destination.internalPath, destination.params) || null;
    case "external":
      return destination.external ?? null;
    case "download":
      return destination.fileUrl ?? null;
    default:
      return null;
  }
};

// Zero in local dev: the Sanity webhook cannot reach `localhost`, so nothing would purge it.
const revalidate = process.env.NODE_ENV === "production" ? REDIRECT_TTL_SECONDS : 0;

export const fetchRedirectEntries = async (): Promise<RedirectEntry[]> => {
  const documents = await client.fetch(
    RedirectQuery,
    {},
    {
      perspective: "published",
      useCdn: true,
      tag: SANITY_TAGS.redirect,
      next: {
        revalidate,
        tags: [GLOBAL_TAG, SANITY_TAGS.redirect],
      },
    },
  );

  return documents.map((document) => ({
    source: document.source,
    destination: resolveRedirectDestination(document.destination),
    permanent: document.permanent,
  }));
};

export const fetchRewriteEntries = async (): Promise<RewriteEntry[]> => {
  const documents = await client.fetch(
    RewriteQuery,
    {},
    {
      perspective: "published",
      useCdn: true,
      tag: SANITY_TAGS.rewrite,
      next: {
        revalidate,
        tags: [GLOBAL_TAG, SANITY_TAGS.rewrite],
      },
    },
  );

  return documents.map((document) => ({
    source: document.source,
    destination: resolveRedirectDestination(document.destination),
  }));
};
