import { notFound } from "next/navigation";

import processMetadata from "@/lib/processMetadata";
import {
  buildRouteGraph,
  podcastListingGraphDocument,
} from "@/lib/schema-org/route-graph";
import { fetchSanity } from "@/sanity/lib/fetch";
import { fetchGlobalSections } from "@/sanity/lib/queries/global-sections";
import {
  buildPodcastEpisodesPageQuery,
  PodcastListingPageQuery,
} from "@/sanity/lib/queries/podcast";
import { getSite, getSiteSchema } from "@/sanity/lib/queries/site";
import { SANITY_TAGS } from "@/sanity/lib/tags";
import {
  PodcastEpisodesPageQueryResult,
  PodcastListingPageQueryResult,
} from "@/types/sanity.types";
import { PageSections } from "@/types/sections";
import { StructuredData } from "@/ui/components/structured-data";
import Sections from "@/ui/sections";
import { EPISODES_PER_PAGE } from "@/ui/sections/PodcastListingSection/constants";
import { FeaturedEpisode } from "@/ui/sections/PodcastListingSection/featured-episode";
import { PodcastHero } from "@/ui/sections/PodcastListingSection/podcast-hero";

const SLUG = "podcast";

const getPage = async () => {
  const page = await fetchSanity<PodcastListingPageQueryResult>({
    query: PodcastListingPageQuery,
    params: { slug: SLUG },
    tags: [SANITY_TAGS["podcast-listing-page"], SANITY_TAGS["podcast-episode"]],
  });

  return page;
};

const PodcastPage = async () => {
  const page = await getPage();

  if (!page) notFound();

  const featured = page.featuredEpisode;
  const excludeIds = featured?._id ? [featured._id] : [];

  const pageSections = (page.sections ?? []) as PageSections;

  const listingSection = pageSections.find(
    (section) => section?._type === "podcast-listing",
  );
  const perPage =
    listingSection && "perPage" in listingSection
      ? (listingSection.perPage ?? EPISODES_PER_PAGE)
      : EPISODES_PER_PAGE;

  const firstPage = await fetchSanity<PodcastEpisodesPageQueryResult>({
    query: buildPodcastEpisodesPageQuery(0, perPage),
    params: { topic: "", season: 0, q: "", excludeIds },
    tags: [SANITY_TAGS["podcast-episode"]],
  });

  const sections = pageSections.map((section) =>
    section?._type === "podcast-listing"
      ? {
          ...section,
          episodes: firstPage?.episodes ?? [],
          total: firstPage?.total ?? 0,
        }
      : section,
  ) as PageSections;

  const [globals, siteSchema] = await Promise.all([
    fetchGlobalSections(SLUG),
    getSiteSchema(),
  ]);
  const mergedSections = [
    ...globals.before,
    ...sections,
    ...globals.after,
  ] as PageSections;
  const graph = buildRouteGraph({
    document: podcastListingGraphDocument(page, siteSchema),
    site: siteSchema,
    sections: mergedSections,
  });

  return (
    <>
      <StructuredData graph={graph} />
      <div className="pt-8 md:pt-16">
        <PodcastHero page={page} />
      </div>
      {featured && (
        <section className="section pb-12 md:pb-24">
          <FeaturedEpisode episode={featured} fallbackLinks={page.platformLinks} />
        </section>
      )}
      <Sections sections={mergedSections} page={page} />
    </>
  );
};

export const generateMetadata = async () => {
  const [page, site] = await Promise.all([getPage(), getSite().catch(() => null)]);

  if (!page) return notFound();

  return processMetadata(page, site);
};

export default PodcastPage;
