// Mirrored in web/src/lib/schema-org/build-graph.ts (`SCHEMA_PAGE_TYPES`): add a type in both.
export const SCHEMA_PAGE_TYPES = [
  { title: "Web Page", value: "WebPage" },
  { title: "Item Page", value: "ItemPage" },
  { title: "About Page", value: "AboutPage" },
  { title: "Contact Page", value: "ContactPage" },
  { title: "Collection Page", value: "CollectionPage" },
  { title: "FAQ Page", value: "FAQPage" },
  { title: "QA Page", value: "QAPage" },
  { title: "Profile Page", value: "ProfilePage" },
] as const;

export type SchemaPageType = (typeof SCHEMA_PAGE_TYPES)[number]["value"];

export const DEFAULT_SCHEMA_PAGE_TYPE: SchemaPageType = "WebPage";

export const SCHEMA_ARTICLE_TYPES = [
  { title: "Article", value: "Article" },
  { title: "Blog Posting", value: "BlogPosting" },
  { title: "News Article", value: "NewsArticle" },
  { title: "None (no Article node)", value: "none" },
] as const;

// A narrower type (e.g. `Restaurant`) goes here AND in build-graph.ts
// (`LOCAL_BUSINESS_TYPES`) + types.ts (`LocalBusinessType`).
export const SCHEMA_LOCAL_BUSINESS_TYPES = [
  { title: "Local Business", value: "LocalBusiness" },
  { title: "Professional Service", value: "ProfessionalService" },
  { title: "None (plain Organization)", value: "none" },
] as const;

// Each type here must spread `structuredDataFields`, or `pnpm typecheck` fails
// after typegen (web/src/lib/schema-org/types.ts).
export const ROUTED_DOCUMENT_TYPES = [
  { name: "page", title: "Page" },
  { name: "post", title: "Blog post" },
  { name: "case-study", title: "Case study" },
  { name: "blog-listing-page", title: "Blog listing page" },
  { name: "case-studies-listing-page", title: "Case studies listing page" },
  { name: "podcast-listing-page", title: "Podcast listing page" },
  { name: "podcast-episode", title: "Podcast episode" },
] as const;

export type RoutedDocumentType = (typeof ROUTED_DOCUMENT_TYPES)[number]["name"];

// Sanity field names can't contain hyphens: `case-study` → `caseStudy`.
export const schemaDefaultFieldName = (type: RoutedDocumentType): string =>
  type.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());

export const schemaPageTypeTitle = (value: string | undefined): string | undefined =>
  SCHEMA_PAGE_TYPES.find((option) => option.value === value)?.title;
