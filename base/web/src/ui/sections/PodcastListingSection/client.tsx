"use client";

import ListingGrid from "@/ui/listing/listing-grid";

import { TOPICS } from "./constants";
import EpisodeRow from "./episode-row";
import { Episode } from "./types";

interface PodcastListingClientProps {
  episodes: Episode[];
  total: number;
  perPage: number;
}

const parseResponse = (data: unknown) => {
  const payload = data as { episodes?: Episode[]; total?: number };

  return { items: payload.episodes ?? [], total: payload.total ?? 0 };
};

const PodcastListingClient = ({
  episodes,
  total,
  perPage,
}: PodcastListingClientProps) => (
  <ListingGrid<Episode>
    initialItems={episodes}
    initialTotal={total}
    perPage={perPage}
    categories={TOPICS}
    apiPath="/api/podcast/episodes"
    parseResponse={parseResponse}
    renderCard={(episode) => <EpisodeRow key={episode._id} episode={episode} />}
    listClassName="mt-8 flex flex-col border-t border-border"
    searchPlaceholder="Search episodes"
    searchLabel="Search episodes"
    emptyLabel="No episodes match your search."
  />
);

export default PodcastListingClient;
