import { stegaClean } from "next-sanity";

import { Slug } from "@/types/sanity.types";

import { BASE_URL } from "./env";

export default function resolveUrl(
  page?: {
    _type?: string;
    slug?: Slug | null;
    metadata?: { slug?: Slug | null } | null;
  },
  {
    base = true,
    params,
  }: {
    base?: boolean;
    params?: string | null;
  } = {},
) {
  const type = stegaClean(page?._type);

  let path: string | null | undefined;
  if (type === "case-study") {
    path = page?.metadata?.slug?.current
      ? `/case-studies/${page.metadata.slug.current}`
      : undefined;
  } else if (type === "post") {
    path = page?.metadata?.slug?.current
      ? `/blog/${page.metadata.slug.current}`
      : undefined;
  } else if (type === "podcast-episode") {
    path = page?.metadata?.slug?.current
      ? `/podcast/${page.metadata.slug.current}`
      : undefined;
  } else if (type === "blog-listing-page") {
    path = "/blog";
  } else if (type === "podcast-listing-page") {
    path = "/podcast";
  } else if (type === "case-studies-listing-page") {
    path = "/case-studies";
  } else {
    path = page?.metadata?.slug?.current;
  }

  // Some `page` slugs are stored without a leading slash, which would resolve relative to
  // the current path (`/blog/pricing` instead of `/pricing`).
  const normalizedPath = path ? ensureLeadingSlash(stegaClean(path)) : path;

  return [base && BASE_URL, normalizedPath, stegaClean(params)].filter(Boolean).join("");
}

export function ensureLeadingSlash(url: string): string {
  return url.startsWith("/") ? url : `/${url}`;
}
