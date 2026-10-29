// Keep this file type-only: `build-graph.ts` imports it with `import type` for the test runner.
import type {
  BlogListingPage,
  CaseStudiesListingPage,
  CaseStudy,
  Page,
  PodcastEpisode,
  PodcastListingPage,
  Post,
} from "@/types/sanity.types";

// Mirrors `ROUTED_DOCUMENT_TYPES` in `studio/.../partials/schemaPageTypes.ts`.
interface RoutedDocuments {
  page: Page;
  post: Post;
  "case-study": CaseStudy;
  "blog-listing-page": BlogListingPage;
  "case-studies-listing-page": CaseStudiesListingPage;
  "podcast-listing-page": PodcastListingPage;
  "podcast-episode": PodcastEpisode;
}

export type RoutedType = keyof RoutedDocuments;

// Drift guard: every routed document must spread `structuredDataFields`. It checks the KEY,
// because `extends { schemaPageType?: unknown }` is satisfied by any object.
type _MissingStructuredDataFields = {
  [Key in RoutedType]: "schemaPageType" extends keyof RoutedDocuments[Key] ? never : Key;
}[RoutedType];
const _AssertStructuredDataFields: _MissingStructuredDataFields extends never
  ? true
  : [
      "These routed documents do not spread structuredDataFields (studio/.../partials/structuredDataFields.ts):",
      _MissingStructuredDataFields,
    ] = true;
void _AssertStructuredDataFields;

/** Mirrors `SCHEMA_PAGE_TYPES` in the Studio. */
export type SchemaPageType =
  | "WebPage"
  | "ItemPage"
  | "AboutPage"
  | "ContactPage"
  | "CollectionPage"
  | "FAQPage"
  | "QAPage"
  | "ProfilePage";

export type SchemaArticleType = "Article" | "BlogPosting" | "NewsArticle" | "none";

/** Mirrors `SCHEMA_LOCAL_BUSINESS_TYPES` in the Studio. */
export type LocalBusinessType = "LocalBusiness" | "ProfessionalService" | "none";

export interface NodeReference {
  "@id": string;
}

export interface SchemaNode {
  "@type": string | string[];
  "@id": string;
  [property: string]: unknown;
}

export interface SchemaGraph {
  "@context": "https://schema.org";
  "@graph": SchemaNode[];
}

export interface PostalAddressData {
  streetAddress?: string | null;
  addressLocality?: string | null;
  addressRegion?: string | null;
  postalCode?: string | null;
  addressCountry?: string | null;
}

export interface SiteSchemaData {
  name: string | null;
  seoTitle: string | null;
  description: string | null;
  headerLogoUrl: string | null;
  legalName: string | null;
  alternateName: string | null;
  address: PostalAddressData | null;
  telephone: string | null;
  email: string | null;
  logoUrl: string | null;
  foundingDate: string | null;
  priceRange: string | null;
  localBusinessType: LocalBusinessType | null;
  sameAs: string[];
  schemaDefaults: Partial<Record<RoutedType, string | null>>;
}

export interface GraphImage {
  url: string;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
}

export interface BreadcrumbItem {
  name: string;
  /** Absolute URL. */
  url: string;
}

export interface GraphAuthor {
  id: string;
  name: string | null;
  role?: string | null;
  imageUrl?: string | null;
  sameAs?: (string | null | undefined)[] | null;
}

export interface GraphDocument {
  type: RoutedType;
  /** Absolute page URL. */
  url: string;
  title: string | null;
  pageName?: string | null;
  description?: string | null;
  noIndex?: boolean | null;
  schemaPageType?: string | null;
  schemaArticleType?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  image?: GraphImage | null;
  breadcrumb: BreadcrumbItem[];
  category?: string | null;
  author?: GraphAuthor | null;
  podcast?: GraphPodcast | null;
}

export interface GraphPodcast {
  seriesUrl: string;
  seriesName: string | null;
  seriesDescription?: string | null;
  seriesImageUrl?: string | null;
  host?: GraphAuthor | null;
  episodeNumber?: number | null;
  season?: number | null;
  durationMinutes?: number | null;
  guest?: GraphAuthor | null;
}

export interface FaqItemInput {
  _key: string;
  question?: string | null;
  answer?: string | null;
}

export interface SectionInput {
  _type: string;
  _key?: string;
  [property: string]: unknown;
}

export interface SectionContext {
  pageUrl: string;
}

// Returned `Question` nodes become the `WebPage` `mainEntity` and add `FAQPage` to its type.
export type SectionSchemaContributor = (
  section: SectionInput,
  context: SectionContext,
) => SchemaNode[];

export interface BuildGraphInput {
  baseUrl: string;
  site: SiteSchemaData | null;
  document: GraphDocument;
  /** A `shared-section-ref` must hold its dereferenced bundles, as `SECTIONS_QUERY` projects them. */
  sections?: readonly (SectionInput | null | undefined)[] | null;
}
