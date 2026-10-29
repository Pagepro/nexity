import { parseListingParams } from "@/lib/listing-params";
import { fetchSanity } from "@/sanity/lib/fetch";
import {
  buildCaseStudiesPageQuery,
  CaseStudiesFeaturedIdsQuery,
} from "@/sanity/lib/queries/case-studies";
import { SANITY_TAGS } from "@/sanity/lib/tags";
import { CaseStudiesPageQueryResult } from "@/types/sanity.types";

// GROQ forbids params in slices, so `start`/`end` are interpolated: they must stay
// the clamped integers from parseListingParams.
export async function GET(request: Request) {
  const { page, perPage, category, matchToken, start, end } = parseListingParams(request);

  const excludeIds =
    (await fetchSanity<string[] | null>({
      query: CaseStudiesFeaturedIdsQuery,
      tags: [SANITY_TAGS["case-study"]],
    })) ?? [];

  const data = await fetchSanity<CaseStudiesPageQueryResult>({
    query: buildCaseStudiesPageQuery(start, end),
    params: { category, q: matchToken, excludeIds },
    tags: [SANITY_TAGS["case-study"]],
  });

  return Response.json({
    caseStudies: data?.caseStudies ?? [],
    total: data?.total ?? 0,
    page,
    perPage,
  });
}
