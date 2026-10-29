import { PageQuery } from "@/app/(frontend)/[[...slug]]/query";
import resolveUrl from "@/lib/resolveUrl";
import { resolveSeoTitle } from "@/lib/seo-title";
import { fetchPublished } from "@/sanity/lib/fetch-published";
import {
  BlogListingPageQuery,
  PostDetailQuery,
  buildBlogPostsPageQuery,
} from "@/sanity/lib/queries/blog";
import {
  CaseStudiesListingPageQuery,
  CaseStudyDetailQuery,
  buildCaseStudiesPageQuery,
} from "@/sanity/lib/queries/case-studies";
import { fetchGlobalSections } from "@/sanity/lib/queries/global-sections";
import {
  PodcastEpisodeDetailQuery,
  PodcastListingPageQuery,
  buildPodcastEpisodesPageQuery,
} from "@/sanity/lib/queries/podcast";
import {
  SANITY_TAGS,
  caseStudyTag,
  pageTag,
  podcastEpisodeTag,
  postTag,
} from "@/sanity/lib/tags";
import type {
  BlogListingPageQueryResult,
  BlogPostsPageQueryResult,
  CaseStudiesListingPageQueryResult,
  CaseStudiesPageQueryResult,
  CaseStudyDetailQueryResult,
  PageQueryResult,
  PodcastEpisodeDetailQueryResult,
  PodcastEpisodesPageQueryResult,
  PodcastListingPageQueryResult,
  PostDetailQueryResult,
} from "@/types/sanity.types";

import {
  blogListingPageToMarkdown,
  caseStudiesListingPageToMarkdown,
  caseStudyToMarkdown,
  episodeToMarkdown,
  pageToMarkdown,
  podcastListingPageToMarkdown,
  postToMarkdown,
  type MarkdownFrontmatter,
} from "./documents";
import { markdownContext } from "./server-context";

// Keep the queries, params and cache tags the same as the HTML routes, so an edit purges both.

// A safety cap, not a page size (the Markdown has no pagination). GROQ slices take literals only.
const LISTING_LIMIT = 1000;

export interface MarkdownResult {
  markdown: string;
  canonicalUrl: string;
}

type SectionsInput = Parameters<typeof pageToMarkdown>[0]["sections"];

interface MetaSource {
  metadata?: {
    title?: string | null;
    seoTitle?: string | null;
    description?: string | null;
    canonical?: string | null;
  } | null;
  _updatedAt?: string | null;
}

const frontmatterOf = (
  document: MetaSource,
  url: string,
  extra: {
    title?: string | null;
    excerpt?: string | null;
    publishedAt?: string | null;
  } = {},
): MarkdownFrontmatter => ({
  title: resolveSeoTitle(document.metadata, extra.title) || extra.title || "",
  description: document.metadata?.description?.trim() || extra.excerpt?.trim() || null,
  url: document.metadata?.canonical?.trim() || url,
  published: extra.publishedAt ?? null,
  updated: document._updatedAt ?? null,
});

const result = (markdown: string, meta: MarkdownFrontmatter): MarkdownResult => ({
  markdown,
  canonicalUrl: meta.url,
});

const globalsFor = (slug: string) => fetchGlobalSections(slug, fetchPublished);

const loadPage = async (slug: string): Promise<MarkdownResult | null> => {
  const page = await fetchPublished<PageQueryResult>({
    query: PageQuery,
    params: { slug },
    tags: [SANITY_TAGS.page, pageTag(slug)],
  });
  if (!page) return null;

  const globals = await globalsFor(slug);
  const meta = frontmatterOf(page, resolveUrl(page), { title: page.metadata?.title });

  return result(
    pageToMarkdown({
      meta,
      title: page.metadata?.title || page.title,
      sections: [
        ...globals.before,
        ...(page.sections ?? []),
        ...globals.after,
      ] as SectionsInput,
      context: markdownContext,
    }),
    meta,
  );
};

const loadPost = async (slug: string): Promise<MarkdownResult | null> => {
  const post = await fetchPublished<PostDetailQueryResult>({
    query: PostDetailQuery,
    params: { slug: `blog/${slug}`, documentSlug: slug },
    tags: [SANITY_TAGS.post, postTag(slug)],
  });
  if (!post) return null;

  const globals = await globalsFor(`blog/${slug}`);
  const url = resolveUrl({
    _type: "post",
    metadata: { slug: { _type: "slug", current: slug } },
  });
  const meta = frontmatterOf(post, url, {
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
  });

  return result(
    postToMarkdown({
      meta,
      document: post,
      globals: globals as Parameters<typeof postToMarkdown>[0]["globals"],
      context: markdownContext,
    }),
    meta,
  );
};

const loadCaseStudy = async (slug: string): Promise<MarkdownResult | null> => {
  const caseStudy = await fetchPublished<CaseStudyDetailQueryResult>({
    query: CaseStudyDetailQuery,
    params: { slug: `case-studies/${slug}`, documentSlug: slug },
    tags: [SANITY_TAGS["case-study"], caseStudyTag(slug)],
  });
  if (!caseStudy) return null;

  const globals = await globalsFor(`case-studies/${slug}`);
  const url = resolveUrl({
    _type: "case-study",
    metadata: { slug: { _type: "slug", current: slug } },
  });
  const meta = frontmatterOf(caseStudy, url, {
    title: caseStudy.title,
    excerpt: caseStudy.excerpt,
    publishedAt: caseStudy.publishedAt,
  });

  return result(
    caseStudyToMarkdown({
      meta,
      document: caseStudy,
      globals: globals as Parameters<typeof caseStudyToMarkdown>[0]["globals"],
      context: markdownContext,
    }),
    meta,
  );
};

const loadEpisode = async (slug: string): Promise<MarkdownResult | null> => {
  const episode = await fetchPublished<PodcastEpisodeDetailQueryResult>({
    query: PodcastEpisodeDetailQuery,
    params: { slug: `podcast/${slug}`, documentSlug: slug },
    tags: [SANITY_TAGS["podcast-episode"], podcastEpisodeTag(slug)],
  });
  if (!episode) return null;

  const globals = await globalsFor(`podcast/${slug}`);
  const url = resolveUrl({
    _type: "podcast-episode",
    metadata: { slug: { _type: "slug", current: slug } },
  });
  const meta = frontmatterOf(episode, url, {
    title: episode.title,
    excerpt: episode.summary,
    publishedAt: episode.publishedAt,
  });

  return result(
    episodeToMarkdown({
      meta,
      document: episode,
      globals: globals as Parameters<typeof episodeToMarkdown>[0]["globals"],
      context: markdownContext,
    }),
    meta,
  );
};

const withListingItems = <TItems>(
  sections: unknown[] | null | undefined,
  type: string,
  items: Record<string, TItems>,
) =>
  (sections ?? []).map((section) =>
    (section as { _type?: string } | null)?._type === type
      ? { ...(section as object), ...items }
      : section,
  );

const loadBlogListing = async (): Promise<MarkdownResult | null> => {
  const page = await fetchPublished<BlogListingPageQueryResult>({
    query: BlogListingPageQuery,
    params: { slug: "blog" },
    tags: [SANITY_TAGS["blog-listing-page"]],
  });
  if (!page) return null;

  const featured = page.featuredPost;
  const [posts, globals] = await Promise.all([
    fetchPublished<BlogPostsPageQueryResult>({
      query: buildBlogPostsPageQuery(0, LISTING_LIMIT),
      params: { category: "", q: "", excludeIds: featured?._id ? [featured._id] : [] },
      tags: [SANITY_TAGS.post],
    }),
    globalsFor("blog"),
  ]);
  const meta = frontmatterOf(page, resolveUrl({ _type: "blog-listing-page" }), {
    title: page.title,
  });

  return result(
    blogListingPageToMarkdown({
      meta,
      page: { ...page, title: page.metadata?.title || page.title },
      featured,
      sections: [
        ...globals.before,
        ...withListingItems(page.sections, "blog-listing", { posts: posts?.posts ?? [] }),
        ...globals.after,
      ] as SectionsInput,
      context: markdownContext,
    }),
    meta,
  );
};

const loadCaseStudiesListing = async (): Promise<MarkdownResult | null> => {
  const page = await fetchPublished<CaseStudiesListingPageQueryResult>({
    query: CaseStudiesListingPageQuery,
    params: { slug: "case-studies" },
    tags: [SANITY_TAGS["case-studies-listing-page"]],
  });
  if (!page) return null;

  const featured = page.featuredCaseStudy;
  const [caseStudies, globals] = await Promise.all([
    fetchPublished<CaseStudiesPageQueryResult>({
      query: buildCaseStudiesPageQuery(0, LISTING_LIMIT),
      params: { category: "", q: "", excludeIds: featured?._id ? [featured._id] : [] },
      tags: [SANITY_TAGS["case-study"]],
    }),
    globalsFor("case-studies"),
  ]);
  const meta = frontmatterOf(page, resolveUrl({ _type: "case-studies-listing-page" }), {
    title: page.title,
  });

  return result(
    caseStudiesListingPageToMarkdown({
      meta,
      page: { ...page, title: page.metadata?.title || page.title },
      featured,
      sections: [
        ...globals.before,
        ...withListingItems(page.sections, "case-studies-listing", {
          caseStudies: caseStudies?.caseStudies ?? [],
        }),
        ...globals.after,
      ] as SectionsInput,
      context: markdownContext,
    }),
    meta,
  );
};

const loadPodcastListing = async (): Promise<MarkdownResult | null> => {
  const page = await fetchPublished<PodcastListingPageQueryResult>({
    query: PodcastListingPageQuery,
    params: { slug: "podcast" },
    tags: [SANITY_TAGS["podcast-listing-page"], SANITY_TAGS["podcast-episode"]],
  });
  if (!page) return null;

  const featured = page.featuredEpisode;
  const [episodes, globals] = await Promise.all([
    fetchPublished<PodcastEpisodesPageQueryResult>({
      query: buildPodcastEpisodesPageQuery(0, LISTING_LIMIT),
      params: {
        topic: "",
        season: 0,
        q: "",
        excludeIds: featured?._id ? [featured._id] : [],
      },
      tags: [SANITY_TAGS["podcast-episode"]],
    }),
    globalsFor("podcast"),
  ]);
  const meta = frontmatterOf(page, resolveUrl({ _type: "podcast-listing-page" }), {
    title: page.title,
  });

  return result(
    podcastListingPageToMarkdown({
      meta,
      page,
      featured,
      sections: [
        ...globals.before,
        ...withListingItems(page.sections, "podcast-listing", {
          episodes: episodes?.episodes ?? [],
        }),
        ...globals.after,
      ] as SectionsInput,
      context: markdownContext,
    }),
    meta,
  );
};

// Keep in sync with the dedicated routes in `app/(frontend)/`.
const ROUTED_LOADERS: Record<
  string,
  {
    listing: () => Promise<MarkdownResult | null>;
    detail: (slug: string) => Promise<MarkdownResult | null>;
  }
> = {
  blog: { listing: loadBlogListing, detail: loadPost },
  "case-studies": { listing: loadCaseStudiesListing, detail: loadCaseStudy },
  podcast: { listing: loadPodcastListing, detail: loadEpisode },
};

/** `contentPath` must already be normalised (`/`, `/pricing`, `/blog/my-post`). */
export const loadMarkdown = async (
  contentPath: string,
): Promise<MarkdownResult | null> => {
  const segments = contentPath.split("/").filter(Boolean);
  if (segments.length === 0) return loadPage("/");

  const routed = ROUTED_LOADERS[segments[0]];
  if (routed) {
    if (segments.length === 1) return routed.listing();
    if (segments.length === 2) return routed.detail(segments[1]);

    return null;
  }

  // The catchall stores a page's slug without its leading slash (`about`, `a/b`).
  return loadPage(segments.join("/"));
};
