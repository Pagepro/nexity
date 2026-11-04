import { defineQuery } from "groq";

import { buildSitemapXml, type SitemapEntry } from "@/lib/sitemap";
import { fetchPublished } from "@/sanity/lib/fetch-published";
import { SANITY_TAGS, SITEMAP_TAG } from "@/sanity/lib/tags";

// Served at `/sitemap.xml` through `SITEMAP_REWRITE` (`@/lib/sitemap` says why). A cached static
// response: the tags on its read purge it. No try/catch: a cached error page would outlive the
// outage, while a failed regeneration keeps serving the last good sitemap.
export const dynamic = "force-static";

// The Studio field descriptions promise noIndex / canonicalised pages stay out of the sitemap.
const INDEXABLE_FILTER = `metadata.noIndex != true && !defined(metadata.canonical)`;

const SITEMAP_QUERY = defineQuery(`{
  'pages': *[
    _type == 'page' &&
    !(metadata.slug.current in ['404']) &&
    ${INDEXABLE_FILTER}
  ]|order(metadata.slug.current){
    'url': $baseUrl + select(metadata.slug.current == '/' => '', metadata.slug.current),
    'lastModified': _updatedAt,
    'priority': select(metadata.slug.current == '/' => 1, 0.5),
  },
  'blog': *[_type == 'blog-listing-page' && _id == 'blogListingPage' && ${INDEXABLE_FILTER}]{
    'url': $baseUrl + 'blog',
    'lastModified': _updatedAt,
    'priority': 0.5,
  },
  'posts': *[_type == 'post' && defined(metadata.slug.current) && ${INDEXABLE_FILTER}]|order(publishedAt desc){
    'url': $baseUrl + 'blog/' + metadata.slug.current,
    'lastModified': _updatedAt,
    'priority': 0.5,
  },
  'caseStudiesListing': *[_type == 'case-studies-listing-page' && _id == 'caseStudiesListingPage' && ${INDEXABLE_FILTER}]{
    'url': $baseUrl + 'case-studies',
    'lastModified': _updatedAt,
    'priority': 0.5,
  },
  'caseStudies': *[_type == 'case-study' && defined(metadata.slug.current) && ${INDEXABLE_FILTER}]|order(coalesce(publishedAt, _createdAt) desc){
    'url': $baseUrl + 'case-studies/' + metadata.slug.current,
    'lastModified': _updatedAt,
    'priority': 0.5,
  },
  'podcast': *[_type == 'podcast-listing-page' && _id == 'podcastListingPage' && ${INDEXABLE_FILTER}]{
    'url': $baseUrl + 'podcast',
    'lastModified': _updatedAt,
    'priority': 0.5,
  },
  'episodes': *[_type == 'podcast-episode' && defined(metadata.slug.current) && ${INDEXABLE_FILTER}]|order(publishedAt desc){
    'url': $baseUrl + 'podcast/' + metadata.slug.current,
    'lastModified': _updatedAt,
    'priority': 0.5,
  }
}`);

export async function GET() {
  const groups = await fetchPublished<Record<string, SitemapEntry[]>>({
    query: SITEMAP_QUERY,
    params: { baseUrl: process.env.NEXT_PUBLIC_BASE_URL + "/" },
    tags: [
      SITEMAP_TAG,
      SANITY_TAGS.page,
      SANITY_TAGS.post,
      SANITY_TAGS["case-study"],
      SANITY_TAGS["podcast-episode"],
      SANITY_TAGS["blog-listing-page"],
      SANITY_TAGS["case-studies-listing-page"],
      SANITY_TAGS["podcast-listing-page"],
    ],
  });

  return new Response(buildSitemapXml(Object.values(groups).flat()), {
    headers: { "Content-Type": "application/xml" },
  });
}
