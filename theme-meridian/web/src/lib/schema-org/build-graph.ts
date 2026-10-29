// Google limits FAQ rich results to a few sites, so "no rich result" in its test tool is
// expected. The `Question` nodes are still emitted for Bing and AI answer engines.
import { stegaClean } from "@sanity/client/stega";

import type { PageSection } from "@/types/sections";

import type {
  BreadcrumbItem,
  BuildGraphInput,
  FaqItemInput,
  GraphAuthor,
  GraphDocument,
  GraphImage,
  LocalBusinessType,
  NodeReference,
  RoutedType,
  SchemaArticleType,
  SchemaGraph,
  SchemaNode,
  SchemaPageType,
  SectionContext,
  SectionInput,
  SectionSchemaContributor,
  SiteSchemaData,
} from "./types";

// Must mirror `studio/.../partials/schemaPageTypes.ts`. A value missing from a list falls
// through to the next precedence level instead of being emitted.

export const SCHEMA_PAGE_TYPES: readonly SchemaPageType[] = [
  "WebPage",
  "ItemPage",
  "AboutPage",
  "ContactPage",
  "CollectionPage",
  "FAQPage",
  "QAPage",
  "ProfilePage",
];

export const DEFAULT_SCHEMA_PAGE_TYPE: SchemaPageType = "WebPage";

const SCHEMA_ARTICLE_TYPES: readonly SchemaArticleType[] = [
  "Article",
  "BlogPosting",
  "NewsArticle",
  "none",
];

const DEFAULT_SCHEMA_ARTICLE_TYPE: SchemaArticleType = "Article";

const LOCAL_BUSINESS_TYPES: readonly LocalBusinessType[] = [
  "LocalBusiness",
  "ProfessionalService",
  "none",
];

/** Matches `<html lang>` in `app/(frontend)/layout.tsx`. */
const IN_LANGUAGE = "en";

const ARTICLE_DOCUMENT_TYPES: readonly RoutedType[] = ["post", "case-study"];

// Every string that goes into a node passes through here: draft-mode stega characters
// must not end up inside machine-readable values.
export const cleanText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const cleaned = stegaClean(value).trim();
  return cleaned.length > 0 ? cleaned : null;
};

const isOneOf = <T extends string>(
  list: readonly T[],
  value: string | null,
): value is T => value !== null && (list as readonly string[]).includes(value);

const originOf = (baseUrl: string): string =>
  cleanText(baseUrl)?.replace(/\/+$/, "") ?? "";

const reference = (id: string): NodeReference => ({ "@id": id });

const compact = <T extends Record<string, unknown>>(node: T): T =>
  Object.fromEntries(
    Object.entries(node).filter(([, value]) => value !== undefined && value !== null),
  ) as T;

const isAbsoluteHttpUrl = (value: string): boolean => /^https?:\/\/\S+$/i.test(value);

export const organizationId = (baseUrl: string) => `${originOf(baseUrl)}/#organization`;
export const websiteId = (baseUrl: string) => `${originOf(baseUrl)}/#website`;
export const logoId = (baseUrl: string) => `${originOf(baseUrl)}/#logo`;
export const personId = (baseUrl: string, authorId: string) =>
  `${originOf(baseUrl)}/#/schema/person/${authorId}`;
export const webPageId = (pageUrl: string) => `${pageUrl}#webpage`;
export const breadcrumbId = (pageUrl: string) => `${pageUrl}#breadcrumb`;
export const primaryImageId = (pageUrl: string) => `${pageUrl}#primaryimage`;
export const articleId = (pageUrl: string) => `${pageUrl}#article`;
export const faqQuestionId = (pageUrl: string, itemKey: string) =>
  `${pageUrl}#faq-${itemKey}`;
export const podcastSeriesId = (seriesUrl: string) => `${seriesUrl}#podcast`;
export const podcastEpisodeId = (pageUrl: string) => `${pageUrl}#episode`;

export const resolvePageType = (
  override: string | null | undefined,
  siteDefault: string | null | undefined,
): SchemaPageType => {
  const cleanOverride = cleanText(override);
  if (isOneOf(SCHEMA_PAGE_TYPES, cleanOverride)) return cleanOverride;
  const cleanDefault = cleanText(siteDefault);
  if (isOneOf(SCHEMA_PAGE_TYPES, cleanDefault)) return cleanDefault;
  return DEFAULT_SCHEMA_PAGE_TYPE;
};

/** `"none"` means no article node. */
export const resolveArticleType = (
  value: string | null | undefined,
): SchemaArticleType => {
  const clean = cleanText(value);
  return isOneOf(SCHEMA_ARTICLE_TYPES, clean) ? clean : DEFAULT_SCHEMA_ARTICLE_TYPE;
};

const siteDefaultFor = (site: SiteSchemaData | null, type: RoutedType): string | null =>
  site?.schemaDefaults?.[type] ?? null;

interface RawImage {
  image?: { asset?: { url?: string | null } | null } | null;
}

export interface RawSiteSchema {
  title?: string | null;
  seo?: { title?: string | null; description?: string | null } | null;
  logo?: RawImage | null;
  structuredData?: {
    legalName?: string | null;
    alternateName?: string | null;
    address?: {
      streetAddress?: string | null;
      addressLocality?: string | null;
      addressRegion?: string | null;
      postalCode?: string | null;
      addressCountry?: string | null;
    } | null;
    telephone?: string | null;
    email?: string | null;
    logo?: RawImage | null;
    foundingDate?: string | null;
    priceRange?: string | null;
    localBusinessType?: string | null;
    sameAs?: (string | null)[] | null;
    /** Keys are the routed type names, camel-cased (Sanity field names cannot hold hyphens). */
    schemaDefaults?: {
      page?: string | null;
      post?: string | null;
      caseStudy?: string | null;
      blogListingPage?: string | null;
      caseStudiesListingPage?: string | null;
      podcastListingPage?: string | null;
      podcastEpisode?: string | null;
    } | null;
  } | null;
}

export const normalizeSameAs = (
  values: readonly (string | null | undefined)[] | null | undefined,
): string[] =>
  (values ?? [])
    .map((value) => cleanText(value))
    .filter((value): value is string => value !== null && isAbsoluteHttpUrl(value));

export const normalizeSiteSchema = (raw: RawSiteSchema): SiteSchemaData => {
  const data = raw.structuredData ?? null;
  const address = data?.address ?? null;
  const localBusinessType = cleanText(data?.localBusinessType);
  const defaults = data?.schemaDefaults ?? null;

  return {
    name: cleanText(raw.title),
    seoTitle: cleanText(raw.seo?.title),
    description: cleanText(raw.seo?.description),
    headerLogoUrl: cleanText(raw.logo?.image?.asset?.url),
    legalName: cleanText(data?.legalName),
    alternateName: cleanText(data?.alternateName),
    address: address
      ? {
          streetAddress: cleanText(address.streetAddress),
          addressLocality: cleanText(address.addressLocality),
          addressRegion: cleanText(address.addressRegion),
          postalCode: cleanText(address.postalCode),
          addressCountry: cleanText(address.addressCountry),
        }
      : null,
    telephone: cleanText(data?.telephone),
    email: cleanText(data?.email),
    logoUrl: cleanText(data?.logo?.image?.asset?.url),
    foundingDate: cleanText(data?.foundingDate),
    priceRange: cleanText(data?.priceRange),
    localBusinessType: isOneOf(LOCAL_BUSINESS_TYPES, localBusinessType)
      ? localBusinessType
      : null,
    sameAs: normalizeSameAs(data?.sameAs),
    schemaDefaults: {
      page: defaults?.page ?? null,
      post: defaults?.post ?? null,
      "case-study": defaults?.caseStudy ?? null,
      "blog-listing-page": defaults?.blogListingPage ?? null,
      "case-studies-listing-page": defaults?.caseStudiesListingPage ?? null,
      "podcast-listing-page": defaults?.podcastListingPage ?? null,
      "podcast-episode": defaults?.podcastEpisode ?? null,
    },
  };
};

// Never throws: a failed read must not fail the render (or the build, on a prerendered route).
export const readSiteSchema = async (
  fetchSite: () => Promise<RawSiteSchema | null | undefined>,
): Promise<SiteSchemaData | null> => {
  try {
    const raw = await fetchSite();
    return raw ? normalizeSiteSchema(raw) : null;
  } catch {
    return null;
  }
};

export const hasLocalBusinessData = (site: SiteSchemaData): boolean =>
  Boolean(site.address?.streetAddress && site.address?.addressLocality && site.telephone);

export const resolveOrganizationType = (site: SiteSchemaData): string => {
  const subtype = site.localBusinessType;
  if (!subtype || subtype === "none") return "Organization";
  return hasLocalBusinessData(site) ? subtype : "Organization";
};

export const buildOrganizationNode = (
  baseUrl: string,
  site: SiteSchemaData,
): SchemaNode | null => {
  const name = cleanText(site.legalName) ?? cleanText(site.name);
  if (!name) return null;

  const type = resolveOrganizationType(site);
  const isLocalBusiness = type !== "Organization";
  const logoUrl = cleanText(site.logoUrl) ?? cleanText(site.headerLogoUrl);
  const address =
    site.address && (site.address.streetAddress || site.address.addressLocality)
      ? compact({
          "@type": "PostalAddress",
          streetAddress: cleanText(site.address.streetAddress),
          addressLocality: cleanText(site.address.addressLocality),
          addressRegion: cleanText(site.address.addressRegion),
          postalCode: cleanText(site.address.postalCode),
          addressCountry: cleanText(site.address.addressCountry),
        })
      : null;
  const sameAs = normalizeSameAs(site.sameAs);

  return compact({
    "@type": type,
    "@id": organizationId(baseUrl),
    name,
    alternateName: cleanText(site.alternateName),
    url: `${originOf(baseUrl)}/`,
    logo: logoUrl ? reference(logoId(baseUrl)) : null,
    image: logoUrl ? reference(logoId(baseUrl)) : null,
    sameAs: sameAs.length > 0 ? sameAs : null,
    address,
    telephone: cleanText(site.telephone),
    email: cleanText(site.email),
    foundingDate: cleanText(site.foundingDate),
    priceRange: isLocalBusiness ? cleanText(site.priceRange) : null,
  });
};

export const buildLogoNode = (
  baseUrl: string,
  site: SiteSchemaData,
): SchemaNode | null => {
  const url = cleanText(site.logoUrl) ?? cleanText(site.headerLogoUrl);
  if (!url) return null;
  return compact({
    "@type": "ImageObject",
    "@id": logoId(baseUrl),
    inLanguage: IN_LANGUAGE,
    url,
    contentUrl: url,
    caption: cleanText(site.legalName) ?? cleanText(site.name),
  });
};

export const buildWebSiteNode = (
  baseUrl: string,
  site: SiteSchemaData,
  organization: SchemaNode | null,
): SchemaNode =>
  compact({
    "@type": "WebSite",
    "@id": websiteId(baseUrl),
    url: `${originOf(baseUrl)}/`,
    name: cleanText(site.seoTitle) ?? cleanText(site.name) ?? cleanText(site.legalName),
    description: cleanText(site.description),
    publisher: organization ? reference(organization["@id"]) : null,
    inLanguage: IN_LANGUAGE,
  });

export const buildImageNode = (
  pageUrl: string,
  image: GraphImage | null | undefined,
): SchemaNode | null => {
  const url = cleanText(image?.url);
  if (!url) return null;
  return compact({
    "@type": "ImageObject",
    "@id": primaryImageId(pageUrl),
    inLanguage: IN_LANGUAGE,
    url,
    contentUrl: url,
    width: image?.width ?? null,
    height: image?.height ?? null,
    caption: cleanText(image?.alt),
  });
};

// The last crumb has no `item`, as in Yoast's and Google's examples.
export const buildBreadcrumbNode = (
  pageUrl: string,
  trail: readonly BreadcrumbItem[],
): SchemaNode | null => {
  const items = trail
    .map((crumb) => ({ name: cleanText(crumb.name), url: cleanText(crumb.url) }))
    .filter((crumb): crumb is { name: string; url: string } =>
      Boolean(crumb.name && crumb.url),
    );
  if (items.length === 0) return null;

  return {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId(pageUrl),
    itemListElement: items.map((crumb, index) =>
      compact({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: index === items.length - 1 ? null : crumb.url,
      }),
    ),
  };
};

interface WebPageNodeOptions {
  pageType: SchemaPageType;
  website: SchemaNode | null;
  organization: SchemaNode | null;
  breadcrumb: SchemaNode | null;
  image: SchemaNode | null;
  questionIds: readonly string[];
}

export const buildWebPageNode = (
  baseUrl: string,
  document: GraphDocument,
  options: WebPageNodeOptions,
): SchemaNode => {
  const { pageType, website, organization, breadcrumb, image, questionIds } = options;
  const isHome = document.url === `${originOf(baseUrl)}/`;
  const hasFaq = questionIds.length > 0;
  const type = hasFaq && pageType !== "FAQPage" ? [pageType, "FAQPage"] : pageType;

  return compact({
    "@type": type,
    "@id": webPageId(document.url),
    url: document.url,
    name: cleanText(document.pageName) ?? cleanText(document.title),
    description: cleanText(document.description),
    isPartOf: website ? reference(website["@id"]) : null,
    about: isHome && organization ? reference(organization["@id"]) : null,
    primaryImageOfPage: image ? reference(image["@id"]) : null,
    image: image ? reference(image["@id"]) : null,
    datePublished: cleanText(document.publishedAt) ?? cleanText(document.createdAt),
    dateModified: cleanText(document.updatedAt),
    breadcrumb: breadcrumb ? reference(breadcrumb["@id"]) : null,
    mainEntity: hasFaq ? questionIds.map(reference) : null,
    inLanguage: IN_LANGUAGE,
  });
};

export const buildPersonNode = (
  baseUrl: string,
  author: GraphAuthor | null | undefined,
): SchemaNode | null => {
  const id = cleanText(author?.id);
  const name = cleanText(author?.name);
  if (!id || !name) return null;
  const imageUrl = cleanText(author?.imageUrl);
  const sameAs = normalizeSameAs(author?.sameAs);

  return compact({
    "@type": "Person",
    "@id": personId(baseUrl, id),
    name,
    jobTitle: cleanText(author?.role),
    sameAs: sameAs.length > 0 ? sameAs : null,
    image: imageUrl
      ? {
          "@type": "ImageObject",
          inLanguage: IN_LANGUAGE,
          url: imageUrl,
          contentUrl: imageUrl,
          caption: name,
        }
      : null,
  });
};

interface ArticleNodeOptions {
  articleType: SchemaArticleType;
  webPage: SchemaNode;
  organization: SchemaNode | null;
  person: SchemaNode | null;
  image: SchemaNode | null;
}

export const buildArticleNode = (
  document: GraphDocument,
  options: ArticleNodeOptions,
): SchemaNode | null => {
  const { articleType, webPage, organization, person, image } = options;
  if (articleType === "none") return null;

  const author = person ?? organization;
  const category = cleanText(document.category);

  return compact({
    "@type": articleType,
    "@id": articleId(document.url),
    isPartOf: reference(webPage["@id"]),
    mainEntityOfPage: reference(webPage["@id"]),
    headline: cleanText(document.title),
    description: cleanText(document.description),
    datePublished: cleanText(document.publishedAt) ?? cleanText(document.createdAt),
    dateModified: cleanText(document.updatedAt),
    author: author ? reference(author["@id"]) : null,
    publisher: organization ? reference(organization["@id"]) : null,
    image: image ? reference(image["@id"]) : null,
    articleSection: category ? [category] : null,
    inLanguage: IN_LANGUAGE,
  });
};

const PODCAST_DOCUMENT_TYPES: readonly RoutedType[] = [
  "podcast-listing-page",
  "podcast-episode",
];

export const isoDuration = (minutes: number | null | undefined): string | null =>
  typeof minutes === "number" && Number.isFinite(minutes) && minutes > 0
    ? `PT${Math.round(minutes)}M`
    : null;

// `/podcast` and every episode page must emit the same series `@id`.
export const buildPodcastSeriesNode = (
  baseUrl: string,
  document: GraphDocument,
  options: { organization: SchemaNode | null; host: SchemaNode | null },
): SchemaNode | null => {
  const podcast = document.podcast;
  const name = cleanText(podcast?.seriesName);
  const seriesUrl = cleanText(podcast?.seriesUrl);
  if (!podcast || !name || !seriesUrl) return null;
  const imageUrl = cleanText(podcast.seriesImageUrl);

  return compact({
    "@type": "PodcastSeries",
    "@id": podcastSeriesId(seriesUrl),
    name,
    url: seriesUrl,
    description: cleanText(podcast.seriesDescription),
    image: imageUrl
      ? { "@type": "ImageObject", url: imageUrl, contentUrl: imageUrl }
      : null,
    author: options.host ? reference(options.host["@id"]) : null,
    publisher: options.organization ? reference(options.organization["@id"]) : null,
    inLanguage: IN_LANGUAGE,
  });
};

export const buildPodcastEpisodeNode = (
  document: GraphDocument,
  options: {
    webPage: SchemaNode;
    series: SchemaNode | null;
    image: SchemaNode | null;
    guest: SchemaNode | null;
  },
): SchemaNode | null => {
  const podcast = document.podcast;
  const name = cleanText(document.title);
  if (!podcast || !name) return null;

  return compact({
    "@type": "PodcastEpisode",
    "@id": podcastEpisodeId(document.url),
    url: document.url,
    mainEntityOfPage: reference(options.webPage["@id"]),
    name,
    description: cleanText(document.description),
    datePublished: cleanText(document.publishedAt) ?? cleanText(document.createdAt),
    episodeNumber: podcast.episodeNumber ?? null,
    partOfSeason:
      typeof podcast.season === "number"
        ? { "@type": "PodcastSeason", seasonNumber: podcast.season }
        : null,
    timeRequired: isoDuration(podcast.durationMinutes),
    partOfSeries: options.series ? reference(options.series["@id"]) : null,
    image: options.image ? reference(options.image["@id"]) : null,
    actor: options.guest ? reference(options.guest["@id"]) : null,
    inLanguage: IN_LANGUAGE,
  });
};

export const faqAnswerText = (answer: unknown): string | null => {
  const clean = cleanText(answer);
  if (!clean) return null;
  const withoutLinks = clean.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1");
  const lines = withoutLinks
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);
  return lines.length > 0 ? lines.join("\n") : null;
};

export const buildFaqQuestionNodes = (
  pageUrl: string,
  items: readonly (FaqItemInput | null | undefined)[] | null | undefined,
): SchemaNode[] =>
  (items ?? []).flatMap((item) => {
    const key = cleanText(item?._key);
    const question = cleanText(item?.question);
    const answer = faqAnswerText(item?.answer);
    if (!key || !question || !answer) return [];
    return [
      {
        "@type": "Question",
        "@id": faqQuestionId(pageUrl, key),
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      },
    ];
  });

type SectionType = PageSection["_type"];

const asFaqItems = (value: unknown): FaqItemInput[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is FaqItemInput =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as FaqItemInput)._key === "string",
      )
    : [];

const faqContributor: SectionSchemaContributor = (
  section: SectionInput,
  context: SectionContext,
) => buildFaqQuestionNodes(context.pageUrl, asFaqItems(section.items));

// `null` is an explicit "nothing"; a section type with no entry fails `pnpm typecheck`.
export const SECTION_SCHEMA_CONTRIBUTORS = {
  "bento-grid": null,
  "blog-listing": null,
  "case-studies-listing": null,
  "comparison-table": null,
  "contact-form": null,
  content: null,
  "cta-banner": null,
  faq: faqContributor,
  "feature-block": null,
  "feature-grid": null,
  hero: null,
  "impact-calculator": null,
  "integrations-grid": null,
  "logos-carousel": null,
  newsletter: null,
  "podcast-listing": null, // the podcast page's reducer owns the PodcastSeries node; episodes have their own graph
  pricing: null, // Product/Offer would need real prices, currency and availability; out of scope
  "split-sections": null,
  stats: null,
  // No Review: Google ignores self-serving reviews, and there is no rating or itemReviewed.
  testimonials: null,
  "text-block": null,
  "trust-badges": null,
  "shared-section-ref": null, // flattened into its inner sections before this registry runs
} satisfies Record<SectionType, SectionSchemaContributor | null>;

// Drift guard: a section type missing above is a compile error that names it.
type _MissingContributors = Exclude<
  SectionType,
  keyof typeof SECTION_SCHEMA_CONTRIBUTORS
>;
const _AssertContributorsComplete: _MissingContributors extends never
  ? true
  : [
      "Declare a schema contributor (or null) in SECTION_SCHEMA_CONTRIBUTORS for:",
      _MissingContributors,
    ] = true;
void _AssertContributorsComplete;

const contributorFor = (type: string): SectionSchemaContributor | null =>
  (SECTION_SCHEMA_CONTRIBUTORS as Record<string, SectionSchemaContributor | null>)[
    type
  ] ?? null;

// Relies on `SECTIONS_QUERY` already dereferencing the bundles; shared sections can't nest.
export const flattenSharedSections = (
  sections: readonly (SectionInput | null | undefined)[] | null | undefined,
): SectionInput[] =>
  (sections ?? []).flatMap((section): SectionInput[] => {
    if (!section) return [];
    if (cleanText(section._type) !== "shared-section-ref") return [section];
    const bundles = Array.isArray(section.sharedSections) ? section.sharedSections : [];
    return bundles.flatMap((bundle) => {
      const inner = (bundle as { sections?: unknown } | null)?.sections;
      return Array.isArray(inner)
        ? inner.filter(
            (entry): entry is SectionInput =>
              typeof entry === "object" &&
              entry !== null &&
              typeof (entry as SectionInput)._type === "string",
          )
        : [];
    });
  });

export const collectSectionNodes = (
  pageUrl: string,
  sections: readonly (SectionInput | null | undefined)[] | null | undefined,
): SchemaNode[] =>
  flattenSharedSections(sections).flatMap((section) => {
    const type = cleanText(section._type);
    const contributor = type ? contributorFor(type) : null;
    return contributor ? contributor(section, { pageUrl }) : [];
  });

const dedupeById = (nodes: readonly (SchemaNode | null)[]): SchemaNode[] => {
  const seen = new Set<string>();
  return nodes.filter((node): node is SchemaNode => {
    if (!node || seen.has(node["@id"])) return false;
    seen.add(node["@id"]);
    return true;
  });
};

export const buildGraph = (input: BuildGraphInput): SchemaGraph | null => {
  const { baseUrl, site, document } = input;
  if (document.noIndex) return null;

  const pageUrl = document.url;

  const organization = site ? buildOrganizationNode(baseUrl, site) : null;
  const logo = site && organization ? buildLogoNode(baseUrl, site) : null;
  const website = site ? buildWebSiteNode(baseUrl, site, organization) : null;

  const image = buildImageNode(pageUrl, document.image);
  const breadcrumb = buildBreadcrumbNode(pageUrl, document.breadcrumb);

  const sectionNodes = dedupeById(collectSectionNodes(pageUrl, input.sections));
  const questionIds = sectionNodes
    .filter((node) => node["@type"] === "Question")
    .map((node) => node["@id"]);

  const pageType = resolvePageType(
    document.schemaPageType,
    siteDefaultFor(site, document.type),
  );
  const webPage = buildWebPageNode(baseUrl, document, {
    pageType,
    website,
    organization,
    breadcrumb,
    image,
    questionIds,
  });

  const hasArticle = ARTICLE_DOCUMENT_TYPES.includes(document.type);
  const person = hasArticle ? buildPersonNode(baseUrl, document.author) : null;
  const article = hasArticle
    ? buildArticleNode(document, {
        articleType: resolveArticleType(document.schemaArticleType),
        webPage,
        organization,
        person,
        image,
      })
    : null;

  const isPodcast = PODCAST_DOCUMENT_TYPES.includes(document.type);
  const host = isPodcast ? buildPersonNode(baseUrl, document.podcast?.host) : null;
  const series = isPodcast
    ? buildPodcastSeriesNode(baseUrl, document, { organization, host })
    : null;
  const guest =
    document.type === "podcast-episode"
      ? buildPersonNode(baseUrl, document.podcast?.guest)
      : null;
  const episode =
    document.type === "podcast-episode"
      ? buildPodcastEpisodeNode(document, { webPage, series, image, guest })
      : null;

  return {
    "@context": "https://schema.org",
    "@graph": dedupeById([
      organization,
      logo,
      website,
      webPage,
      breadcrumb,
      image,
      article,
      person,
      series,
      episode,
      host,
      guest,
      ...sectionNodes,
    ]),
  };
};

// Escapes `<`, `>` and `&` so no value (a `</script>` in a FAQ answer) can close the script element.
export const serializeGraph = (graph: SchemaGraph): string =>
  JSON.stringify(graph)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
