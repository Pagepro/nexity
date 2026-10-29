// Keep parity with `<head>`: the `WebPage` name is the exact `<title>` (`buildSeoTitle`) and
// the description the exact meta description (`buildSeoDescription`).
import { getImageDimensions } from "@sanity/asset-utils";

import { BASE_URL, IS_INDEXABLE } from "@/lib/env";
import resolveUrl from "@/lib/resolveUrl";
import { buildSeoDescription, buildSeoTitle } from "@/lib/seo-title";
import type { ImageFragment } from "@/types/fragments";
import type {
  BlogListingPageQueryResult,
  CaseStudiesListingPageQueryResult,
  CaseStudyDetailQueryResult,
  PageQueryResult,
  PodcastEpisodeDetailQueryResult,
  PodcastListingPageQueryResult,
  PostDetailQueryResult,
} from "@/types/sanity.types";

import { buildGraph } from "./build-graph";
import type {
  BreadcrumbItem,
  GraphAuthor,
  GraphDocument,
  GraphImage,
  SchemaGraph,
  SectionInput,
  SiteSchemaData,
} from "./types";

const HOME_CRUMB_NAME = "Home";
const BLOG_CRUMB_NAME = "Blog";
const CASE_STUDIES_CRUMB_NAME = "Case studies";
const PODCAST_CRUMB_NAME = "Podcast";

const absolute = (path: string): string => `${BASE_URL}${path}`;

const homeCrumb = (): BreadcrumbItem => ({ name: HOME_CRUMB_NAME, url: absolute("/") });

// Must use the same two inputs as `buildRobotsAndAlternates` for `<meta name="robots">`.
const resolveNoIndex = (
  metadata: { noIndex?: boolean | null } | null | undefined,
): boolean => Boolean(metadata?.noIndex) || !IS_INDEXABLE;

const siteTitleSource = (site: SiteSchemaData | null) =>
  site
    ? { title: site.name, seo: { title: site.seoTitle, description: site.description } }
    : null;

export const graphImage = (
  image: ImageFragment | null | undefined,
): GraphImage | null => {
  const inner = image?.image;
  const url = inner?.asset?.url;
  if (!url) return null;
  let width: number | null = null;
  let height: number | null = null;
  try {
    const dimensions = getImageDimensions(url);
    width = dimensions.width;
    height = dimensions.height;
  } catch {
    // A local placeholder or an asset without a parseable id: keep only the URL.
  }
  return { url, width, height, alt: image?.alt ?? inner?.asset?.altText ?? null };
};

interface AuthorFragmentLike {
  _id: string;
  firstName: string | null;
  lastName: string | null;
  position: string | null;
  linkedinUrl: string | null;
  avatar: ImageFragment | null;
}

const graphAuthor = (
  author: AuthorFragmentLike | null | undefined,
): GraphAuthor | null =>
  author?._id
    ? {
        id: author._id,
        name: [author.firstName, author.lastName].filter(Boolean).join(" ") || null,
        role: author.position,
        imageUrl: author.avatar?.image?.asset?.url ?? null,
        sameAs: [author.linkedinUrl],
      }
    : null;

interface RouteGraphInput {
  document: GraphDocument;
  site: SiteSchemaData | null;
  /** The sections the page renders (global before + its own + global after). */
  sections?: readonly (SectionInput | null | undefined)[] | null;
}

export const buildRouteGraph = ({
  document,
  site,
  sections,
}: RouteGraphInput): SchemaGraph | null =>
  buildGraph({ baseUrl: BASE_URL, site, document, sections });

export const pageGraphDocument = (
  page: NonNullable<PageQueryResult>,
  site: SiteSchemaData | null,
): GraphDocument => {
  const url = resolveUrl(page);
  const title = page.metadata?.title || page.title || null;
  const isHome = url === absolute("/");
  const titleSite = siteTitleSource(site);
  return {
    type: "page",
    url,
    title,
    pageName: buildSeoTitle({
      metadata: page.metadata,
      documentTitle: page.title,
      site: titleSite,
    }),
    description: buildSeoDescription({
      metadataDescription: page.metadata?.description,
      site: titleSite,
    }),
    noIndex: resolveNoIndex(page.metadata),
    schemaPageType: page.schemaPageType,
    createdAt: page._createdAt,
    updatedAt: page._updatedAt,
    image: graphImage(page.metadata?.image),
    breadcrumb: isHome || !title ? [homeCrumb()] : [homeCrumb(), { name: title, url }],
  };
};

type ListingPage =
  | NonNullable<BlogListingPageQueryResult>
  | NonNullable<CaseStudiesListingPageQueryResult>;

const listingGraphDocument = (
  page: ListingPage,
  site: SiteSchemaData | null,
  fallbackTitle: string,
): GraphDocument => {
  const url = resolveUrl(page);
  const title = page.metadata?.title || page.title || fallbackTitle;
  const titleSite = siteTitleSource(site);
  return {
    type: page._type,
    url,
    title,
    pageName: buildSeoTitle({
      metadata: page.metadata,
      documentTitle: page.title,
      site: titleSite,
    }),
    description: buildSeoDescription({
      metadataDescription: page.metadata?.description,
      site: titleSite,
    }),
    noIndex: resolveNoIndex(page.metadata),
    schemaPageType: page.schemaPageType,
    createdAt: page._createdAt,
    updatedAt: page._updatedAt,
    image: graphImage(page.metadata?.image),
    breadcrumb: [homeCrumb(), { name: title, url }],
  };
};

export const blogListingGraphDocument = (
  page: NonNullable<BlogListingPageQueryResult>,
  site: SiteSchemaData | null,
): GraphDocument => listingGraphDocument(page, site, BLOG_CRUMB_NAME);

export const caseStudiesListingGraphDocument = (
  page: NonNullable<CaseStudiesListingPageQueryResult>,
  site: SiteSchemaData | null,
): GraphDocument => listingGraphDocument(page, site, CASE_STUDIES_CRUMB_NAME);

export const postGraphDocument = (
  post: NonNullable<PostDetailQueryResult>,
  site: SiteSchemaData | null,
): GraphDocument => {
  const url = resolveUrl({
    _type: "post",
    metadata: { slug: { _type: "slug", current: post.slug ?? "" } },
  });
  const title = post.title || null;
  const titleSite = siteTitleSource(site);
  return {
    type: "post",
    url,
    title,
    pageName: buildSeoTitle({
      metadata: post.metadata,
      documentTitle: title,
      site: titleSite,
    }),
    description: buildSeoDescription({
      metadataDescription: post.metadata?.description,
      excerpt: post.excerpt,
      site: titleSite,
    }),
    noIndex: resolveNoIndex(post.metadata),
    schemaPageType: post.schemaPageType,
    schemaArticleType: post.schemaArticleType,
    createdAt: post._createdAt,
    updatedAt: post._updatedAt,
    publishedAt: post.publishedAt,
    image: graphImage(post.metadata?.image) ?? graphImage(post.coverImage),
    breadcrumb: [
      homeCrumb(),
      { name: BLOG_CRUMB_NAME, url: absolute("/blog") },
      ...(title ? [{ name: title, url }] : []),
    ],
    category: post.category,
    author: graphAuthor(post.author),
  };
};

export const caseStudyGraphDocument = (
  caseStudy: NonNullable<CaseStudyDetailQueryResult>,
  site: SiteSchemaData | null,
): GraphDocument => {
  const url = resolveUrl({
    _type: "case-study",
    metadata: { slug: { _type: "slug", current: caseStudy.slug ?? "" } },
  });
  const title = caseStudy.title || null;
  const titleSite = siteTitleSource(site);
  return {
    type: "case-study",
    url,
    title,
    pageName: buildSeoTitle({
      metadata: caseStudy.metadata,
      documentTitle: title,
      site: titleSite,
    }),
    description: buildSeoDescription({
      metadataDescription: caseStudy.metadata?.description,
      excerpt: caseStudy.excerpt,
      site: titleSite,
    }),
    noIndex: resolveNoIndex(caseStudy.metadata),
    schemaPageType: caseStudy.schemaPageType,
    schemaArticleType: caseStudy.schemaArticleType,
    createdAt: caseStudy._createdAt,
    updatedAt: caseStudy._updatedAt,
    publishedAt: caseStudy.publishedAt,
    image: graphImage(caseStudy.metadata?.image) ?? graphImage(caseStudy.image),
    breadcrumb: [
      homeCrumb(),
      { name: CASE_STUDIES_CRUMB_NAME, url: absolute("/case-studies") },
      ...(title ? [{ name: title, url }] : []),
    ],
    category: caseStudy.category,
    author: graphAuthor(caseStudy.author),
  };
};

const PODCAST_URL = "/podcast";

export const podcastListingGraphDocument = (
  page: NonNullable<PodcastListingPageQueryResult>,
  site: SiteSchemaData | null,
): GraphDocument => {
  const url = resolveUrl(page);
  const title = page.metadata?.title || page.title || PODCAST_CRUMB_NAME;
  const titleSite = siteTitleSource(site);
  const description = buildSeoDescription({
    metadataDescription: page.metadata?.description,
    site: titleSite,
  });
  return {
    type: page._type,
    url,
    title,
    pageName: buildSeoTitle({
      metadata: page.metadata,
      documentTitle: page.title,
      site: titleSite,
    }),
    description,
    noIndex: resolveNoIndex(page.metadata),
    schemaPageType: page.schemaPageType,
    createdAt: page._createdAt,
    updatedAt: page._updatedAt,
    image: graphImage(page.metadata?.image) ?? graphImage(page.coverArt),
    breadcrumb: [homeCrumb(), { name: title, url }],
    podcast: {
      seriesUrl: absolute(PODCAST_URL),
      seriesName: page.title ?? null,
      seriesDescription: description,
      seriesImageUrl: page.coverArt?.image?.asset?.url ?? null,
      host: graphAuthor(page.host),
    },
  };
};

export const podcastEpisodeGraphDocument = (
  episode: NonNullable<PodcastEpisodeDetailQueryResult>,
  site: SiteSchemaData | null,
): GraphDocument => {
  const url = resolveUrl({
    _type: "podcast-episode",
    metadata: { slug: { _type: "slug", current: episode.slug ?? "" } },
  });
  const title = episode.title || null;
  const titleSite = siteTitleSource(site);
  return {
    type: "podcast-episode",
    url,
    title,
    pageName: buildSeoTitle({
      metadata: episode.metadata,
      documentTitle: title,
      site: titleSite,
    }),
    description: buildSeoDescription({
      metadataDescription: episode.metadata?.description,
      excerpt: episode.summary,
      site: titleSite,
    }),
    noIndex: resolveNoIndex(episode.metadata),
    schemaPageType: episode.schemaPageType,
    createdAt: episode._createdAt,
    updatedAt: episode._updatedAt,
    publishedAt: episode.publishedAt,
    image:
      graphImage(episode.metadata?.image) ??
      graphImage(episode.coverArt) ??
      graphImage(episode.show?.coverArt),
    breadcrumb: [
      homeCrumb(),
      { name: PODCAST_CRUMB_NAME, url: absolute(PODCAST_URL) },
      ...(title ? [{ name: title, url }] : []),
    ],
    podcast: {
      seriesUrl: absolute(PODCAST_URL),
      seriesName: episode.show?.title ?? null,
      seriesImageUrl: episode.show?.coverArt?.image?.asset?.url ?? null,
      host: graphAuthor(episode.show?.host),
      episodeNumber: episode.episodeNumber,
      season: episode.season,
      durationMinutes: episode.durationMinutes,
      guest: graphAuthor(episode.guest),
    },
  };
};
