// On every published fetch; the webhook purges it for referenced-only and unknown types.
export const GLOBAL_TAG = "sanity";

// The sitemap's `lastModified` is `_updatedAt`, so even a content-only edit purges it.
export const SITEMAP_TAG = "sitemap";

// Keys are Sanity `_type` strings.
export const SANITY_TAGS = {
  site: "site",
  header: "header",
  footer: "footer",
  "global-section": "global-section",
  page: "page",
  post: "post",
  "case-study": "case-study",
  "blog-listing-page": "blog-listing-page",
  "case-studies-listing-page": "case-studies-listing-page",
  "podcast-listing-page": "podcast-listing-page",
  "podcast-episode": "podcast-episode",
  // Own tags, not the global one: publishing a redirect/rewrite must not purge every page.
  redirect: "redirect",
  rewrite: "rewrite",
} as const;

export type SanityTagType = keyof typeof SANITY_TAGS;

export const pageTag = (slug: string) => `page:${slug}`;
export const postTag = (slug: string) => `post:${slug}`;
export const caseStudyTag = (slug: string) => `case-study:${slug}`;
export const podcastEpisodeTag = (slug: string) => `podcast-episode:${slug}`;

const DETAIL_TAGS: Record<string, (slug: string) => string> = {
  page: pageTag,
  post: postTag,
  "case-study": caseStudyTag,
  "podcast-episode": podcastEpisodeTag,
};

// Names a read in Sanity's request log; a slug-scoped tag has a `:` the API rejects.
export const requestTagFor = (tags?: string[]) =>
  tags?.find((tag) => /^[\w.-]+$/.test(tag));

// `contentOnly`: the webhook saw only fields no other document reads change (a page's
// `sections`, a post's `body`), so the document's own route is the only stale one.
export const tagsForDocumentType = (
  type: string,
  slug?: string | null,
  { contentOnly = false }: { contentOnly?: boolean } = {},
): string[] => {
  const detailTag = slug ? DETAIL_TAGS[type]?.(slug) : undefined;

  if (contentOnly && detailTag) return [detailTag, SITEMAP_TAG];

  switch (type) {
    case "site":
    case "header":
    case "footer":
    case "global-section":
    case "blog-listing-page":
    case "case-studies-listing-page":
    case "podcast-listing-page":
    case "redirect":
    case "rewrite":
      return [SANITY_TAGS[type]];
    case "podcast-episode":
      return slug
        ? [SANITY_TAGS["podcast-episode"], podcastEpisodeTag(slug)]
        : [SANITY_TAGS["podcast-episode"]];
    case "page":
      return slug ? [SANITY_TAGS.page, pageTag(slug)] : [SANITY_TAGS.page];
    case "post":
      return slug ? [SANITY_TAGS.post, postTag(slug)] : [SANITY_TAGS.post];
    case "case-study":
      return slug
        ? [SANITY_TAGS["case-study"], caseStudyTag(slug)]
        : [SANITY_TAGS["case-study"]];
    default:
      return [GLOBAL_TAG];
  }
};
