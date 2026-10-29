import { defineQuery } from "groq";

import { AUTHOR_FRAGMENT } from "@/sanity/lib/fragments/author";
import { IMAGE_FRAGMENT } from "@/sanity/lib/fragments/image";
import { METADATA_FRAGMENT } from "@/sanity/lib/fragments/metadata";
import { STRUCTURED_DATA_FRAGMENT } from "@/sanity/lib/fragments/structured-data";
import { RICHTEXT_QUERY, SECTIONS_QUERY } from "@/sanity/lib/queries";

const PLATFORM_LINKS_PROJECTION = `platformLinks[] { _key, platform, url }`;

const EPISODE_CARD_PROJECTION = `
  _id,
  "title": metadata.title,
  "slug": metadata.slug.current,
  episodeNumber,
  season,
  publishedAt,
  durationMinutes,
  topic,
  summary,
  "guest": guests[0]->{ ${AUTHOR_FRAGMENT} },
  chapters[] { _key, timestamp, title },
  ${PLATFORM_LINKS_PROJECTION},
  coverArt {
    ${IMAGE_FRAGMENT}
  }
`;

export const PodcastListingPageQuery = defineQuery(`
  *[_type == 'podcast-listing-page' && _id == 'podcastListingPage'][0]{
    ...,
    content[] {
      ${RICHTEXT_QUERY}
    },
    "host": hosts[0]->{ ${AUTHOR_FRAGMENT} },
    coverArt {
      ${IMAGE_FRAGMENT}
    },
    ${PLATFORM_LINKS_PROJECTION},
    "featuredEpisode": coalesce(
      featuredEpisode[0]->{ ${EPISODE_CARD_PROJECTION} },
      *[_type == 'podcast-episode' && defined(metadata.slug.current)] | order(publishedAt desc)[0]{ ${EPISODE_CARD_PROJECTION} }
    ),
    'sections': sections[]{ ${SECTIONS_QUERY} },
    metadata {
      ${METADATA_FRAGMENT}
    },
    ${STRUCTURED_DATA_FRAGMENT},
  }
`);

const EPISODES_FILTER = `_type == 'podcast-episode'
  && defined(metadata.slug.current)
  && ($topic == '' || topic == $topic)
  && ($season == 0 || season == $season)
  && ($q == '' || metadata.title match $q || summary match $q || guests[0]->firstName match $q || guests[0]->lastName match $q || guests[0]->company match $q)
  && !(_id in $excludeIds)`;

// Typegen-only (constant slice); the runtime query is `buildPodcastEpisodesPageQuery`.
export const PodcastEpisodesPageQuery = defineQuery(`{
  "episodes": *[${EPISODES_FILTER}] | order(publishedAt desc) [0...8] { ${EPISODE_CARD_PROJECTION} },
  "total": count(*[${EPISODES_FILTER}])
}`);

// `select` on the count, not `coalesce`: the Studio leaves an empty (non-null)
// `featuredEpisode` array after unpinning, so `coalesce` would never fall through.
export const PodcastFeaturedIdsQuery = defineQuery(`
  select(
    count(*[_type == 'podcast-listing-page' && _id == 'podcastListingPage'][0].featuredEpisode) > 0 =>
      *[_type == 'podcast-listing-page' && _id == 'podcastListingPage'][0].featuredEpisode[]._ref,
    *[_type == 'podcast-episode' && defined(metadata.slug.current)] | order(publishedAt desc)[0...1]._id
  )
`);

export const buildPodcastEpisodesPageQuery = (start: number, end: number): string => `{
  "episodes": *[${EPISODES_FILTER}] | order(publishedAt desc) [${start}...${end}] { ${EPISODE_CARD_PROJECTION} },
  "total": count(*[${EPISODES_FILTER}])
}`;

export const PodcastEpisodeDetailQuery = defineQuery(`
  *[_type == 'podcast-episode' && metadata.slug.current == $documentSlug][0]{
    ${EPISODE_CARD_PROJECTION},
    showNotes[] {
      ${RICHTEXT_QUERY}
    },
    transcript[] {
      ${RICHTEXT_QUERY}
    },
    metadata {
      ${METADATA_FRAGMENT}
    },
    ${STRUCTURED_DATA_FRAGMENT},
    "show": *[_type == 'podcast-listing-page' && _id == 'podcastListingPage'][0]{
      title,
      "host": hosts[0]->{ ${AUTHOR_FRAGMENT} },
      coverArt { ${IMAGE_FRAGMENT} },
      ${PLATFORM_LINKS_PROJECTION}
    },
    // "More episodes": same-topic first (newest first), topped up to 3 with the
    // most recent episodes of any topic. Slice bounds must be constant literals.
    'otherEpisodes': *[_type == 'podcast-episode' && metadata.slug.current != $documentSlug && defined(metadata.slug.current)]
      | order(select(topic == ^.topic => 0, 1) asc, publishedAt desc)[0...3]{
        ${EPISODE_CARD_PROJECTION}
      },
  }
`);

export const PodcastEpisodeSlugsQuery = defineQuery(`
  *[_type == 'podcast-episode' && defined(metadata.slug.current)]{
    "slug": metadata.slug.current
  }
`);
