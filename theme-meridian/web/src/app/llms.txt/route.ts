import { defineQuery } from "groq";

import {
  buildLlmsTxt,
  LLMS_FALLBACK_TITLE,
  type LlmsTxtData,
} from "@/lib/markdown/llms-txt";
import { markdownContext } from "@/lib/markdown/server-context";
import { markdownAlternateFor } from "@/lib/seo-robots";
import { fetchPublished } from "@/sanity/lib/fetch-published";
import { SANITY_TAGS } from "@/sanity/lib/tags";

const LLMS_DATA_QUERY = defineQuery(`{
  "site": *[_type == 'site'][0]{
    "title": coalesce(seo.title, title),
    "description": seo.description
  },
  "pages": *[_type == 'page' && defined(metadata.slug.current) && metadata.noIndex != true && metadata.slug.current != '404']
    | order(select(metadata.slug.current == '/' => 0, 1) asc, metadata.slug.current asc){
      _type, title, metadata { slug, title, description }
    },
  "listings": *[_type in ['blog-listing-page', 'case-studies-listing-page', 'podcast-listing-page'] && metadata.noIndex != true]{
    _type, title, metadata { slug, title, description }
  },
  "posts": *[_type == 'post' && defined(metadata.slug.current) && metadata.noIndex != true]
    | order(publishedAt desc){ _type, metadata { slug, title, description }, "summary": excerpt },
  "caseStudies": *[_type == 'case-study' && defined(metadata.slug.current) && metadata.noIndex != true]
    | order(publishedAt desc){ _type, metadata { slug, title, description }, "summary": excerpt },
  "episodes": *[_type == 'podcast-episode' && defined(metadata.slug.current) && metadata.noIndex != true]
    | order(publishedAt desc){ _type, metadata { slug, title, description }, summary }
}`);

export async function GET() {
  try {
    const data = await fetchPublished<LlmsTxtData>({
      query: LLMS_DATA_QUERY,
      tags: [
        SANITY_TAGS.site,
        SANITY_TAGS.page,
        SANITY_TAGS.post,
        SANITY_TAGS["case-study"],
        SANITY_TAGS["podcast-episode"],
        SANITY_TAGS["blog-listing-page"],
        SANITY_TAGS["case-studies-listing-page"],
        SANITY_TAGS["podcast-listing-page"],
      ],
    });
    const body = buildLlmsTxt(data, (document) => {
      const url = markdownContext.documentUrl(document);

      return url ? (markdownAlternateFor(url) ?? null) : null;
    });

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        // No `s-maxage`: an edge copy would outlive the `revalidateTag` purge.
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating llms.txt:", error);

    return new Response(
      `# ${LLMS_FALLBACK_TITLE}\n\nThe page list is unavailable right now. Try again shortly.\n`,
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
