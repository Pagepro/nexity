// Shared by the web metadata builders and the Studio SERP preview. Keep it PURE (no `sanity`, React,
// `@/` aliases or env reads): the web server bundle imports it and web tests load it with Node's type stripper.

/** Rename alongside the project display name. */
export const FALLBACK_SITE_TITLE = "Nexity";

export interface SeoTitleSource {
  title?: string | null;
  seoTitle?: string | null;
}

export interface SiteTitleSource {
  title?: string | null;
  seo?: { title?: string | null; description?: string | null } | null;
}

export const resolveSeoTitle = (
  metadata: SeoTitleSource | null | undefined,
  documentTitle?: string | null,
): string =>
  metadata?.seoTitle?.trim() || metadata?.title?.trim() || documentTitle?.trim() || "";

export const resolveSiteTitle = (site: SiteTitleSource | null | undefined): string =>
  site?.seo?.title?.trim() || site?.title?.trim() || FALLBACK_SITE_TITLE;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const withSiteTitle = (
  title: string | null | undefined,
  siteTitle: string,
): string => {
  const trimmed = title?.trim();

  if (!trimmed) return siteTitle;
  if (new RegExp(`(^|\\W)${escapeRegExp(siteTitle)}(\\W|$)`).test(trimmed)) {
    return trimmed;
  }

  return `${trimmed} | ${siteTitle}`;
};

export const buildSeoTitle = ({
  metadata,
  documentTitle,
  site,
}: {
  metadata: SeoTitleSource | null | undefined;
  documentTitle?: string | null;
  site: SiteTitleSource | null | undefined;
}): string =>
  withSiteTitle(resolveSeoTitle(metadata, documentTitle), resolveSiteTitle(site));

export const buildSeoDescription = ({
  metadataDescription,
  excerpt,
  site,
}: {
  metadataDescription?: string | null;
  excerpt?: string | null;
  site: SiteTitleSource | null | undefined;
}): string =>
  metadataDescription?.trim() || excerpt?.trim() || site?.seo?.description?.trim() || "";
