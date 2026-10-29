import type { Metadata } from "next";

import { MetadataFragment } from "@/types/fragments";
import { SiteQueryResult } from "@/types/sanity.types";

import { BASE_URL, IS_INDEXABLE } from "./env";
import { toOgImage } from "./og-image";
import resolveUrl from "./resolveUrl";
import { buildRobotsAndAlternates } from "./seo-robots";
import { buildSeoDescription, buildSeoTitle, resolveSiteTitle } from "./seo-title";

export default async function processMetadata(
  page: {
    title?: string | null;
    metadata?: MetadataFragment | null;
  },
  site?: SiteQueryResult,
): Promise<Metadata> {
  const url = page ? resolveUrl(page) : undefined;
  const imageObject = page?.metadata?.image ?? null;

  const siteTitle = resolveSiteTitle(site);
  const description = buildSeoDescription({
    metadataDescription: page?.metadata?.description,
    site,
  });
  // og:title deliberately skips the SEO title override: a social card reads like the page.
  const ogTitle = page?.metadata?.title?.trim() || page?.title?.trim() || siteTitle;

  return {
    metadataBase: new URL(BASE_URL),
    title: buildSeoTitle({ metadata: page?.metadata, documentTitle: page?.title, site }),
    description: description || undefined,
    openGraph: {
      type: "website",
      siteName: siteTitle,
      url,
      title: ogTitle,
      description,
      images:
        toOgImage(imageObject) ??
        `${BASE_URL}/api/og?title=${encodeURIComponent(ogTitle)}`,
    },
    ...buildRobotsAndAlternates(page?.metadata, url, { isIndexable: IS_INDEXABLE }),
  };
}
