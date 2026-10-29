import { parseListingParams } from "@/lib/listing-params";
import { fetchSanity } from "@/sanity/lib/fetch";
import { BlogFeaturedIdsQuery, buildBlogPostsPageQuery } from "@/sanity/lib/queries/blog";
import { SANITY_TAGS } from "@/sanity/lib/tags";
import { BlogPostsPageQueryResult } from "@/types/sanity.types";

// GROQ forbids params in slices, so `start`/`end` are interpolated: they must stay
// the clamped integers from parseListingParams.
export async function GET(request: Request) {
  const { page, perPage, category, matchToken, start, end } = parseListingParams(request);

  const excludeIds =
    (await fetchSanity<string[] | null>({
      query: BlogFeaturedIdsQuery,
      tags: [SANITY_TAGS.post],
    })) ?? [];

  const data = await fetchSanity<BlogPostsPageQueryResult>({
    query: buildBlogPostsPageQuery(start, end),
    params: { category, q: matchToken, excludeIds },
    tags: [SANITY_TAGS.post],
  });

  return Response.json({
    posts: data?.posts ?? [],
    total: data?.total ?? 0,
    page,
    perPage,
  });
}
