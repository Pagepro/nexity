import { parseListingParams } from "@/lib/listing-params";
import { fetchSanity } from "@/sanity/lib/fetch";
import {
  buildPodcastEpisodesPageQuery,
  PodcastFeaturedIdsQuery,
} from "@/sanity/lib/queries/podcast";
import { SANITY_TAGS } from "@/sanity/lib/tags";
import { PodcastEpisodesPageQueryResult } from "@/types/sanity.types";

export async function GET(request: Request) {
  const { page, perPage, category, season, matchToken, start, end } =
    parseListingParams(request);

  const excludeIds =
    (await fetchSanity<string[] | null>({
      query: PodcastFeaturedIdsQuery,
      tags: [SANITY_TAGS["podcast-episode"], SANITY_TAGS["podcast-listing-page"]],
    })) ?? [];

  const data = await fetchSanity<PodcastEpisodesPageQueryResult>({
    query: buildPodcastEpisodesPageQuery(start, end),
    params: { topic: category, season, q: matchToken, excludeIds },
    tags: [SANITY_TAGS["podcast-episode"]],
  });

  return Response.json({
    episodes: data?.episodes ?? [],
    total: data?.total ?? 0,
    page,
    perPage,
  });
}
