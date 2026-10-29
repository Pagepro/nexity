import {
  PodcastEpisodesPageQueryResult,
  PodcastListingPageQueryResult,
} from "@/types/sanity.types";
import { ExtractSectionProps } from "@/types/sections";

export type Episode = PodcastEpisodesPageQueryResult["episodes"][number];

export type PodcastPage = NonNullable<PodcastListingPageQueryResult>;

export type PlatformLink = NonNullable<PodcastPage["platformLinks"]>[number];

/** `episodes` (first page) and `total` are injected by the route (`podcast/page.tsx`),
 * not returned by the section's GROQ branch. */
export interface PodcastListingSectionProps extends ExtractSectionProps<"podcast-listing"> {
  episodes?: Episode[];
  total?: number;
}
