import { Suspense } from "react";

import sectionProps from "@/lib/sectionProps";

import PodcastListingClient from "./client-lazy";
import { EPISODES_PER_PAGE, LISTING_HEADING } from "./constants";
import EpisodeRow from "./episode-row";
import { PodcastListingSectionProps } from "./types";

const ListingHeading = () => (
  <div className="flex max-w-xl flex-col gap-4 text-balance">
    <p className="pretitle">{LISTING_HEADING.pretitle}</p>
    <h2 className="text-30 leading-tight font-medium tracking-tight text-foreground md:text-36">
      {LISTING_HEADING.title}
    </h2>
    <p className="max-w-xl text-16 text-muted-foreground">{LISTING_HEADING.intro}</p>
  </div>
);

const PodcastListingFallback = ({
  episodes,
}: {
  episodes: PodcastListingSectionProps["episodes"];
}) => {
  if (!episodes || episodes.length === 0) return null;

  return (
    <div className="mt-8 flex flex-col border-t border-border">
      {episodes.map((episode) => (
        <EpisodeRow key={episode._id} episode={episode} />
      ))}
    </div>
  );
};

const PodcastListingSection = ({
  episodes = [],
  total = 0,
  perPage,
  ...props
}: PodcastListingSectionProps) => (
  <section className="section pt-8 pb-12 md:pt-16 md:pb-24" {...sectionProps(props)}>
    <ListingHeading />
    <Suspense fallback={<PodcastListingFallback episodes={episodes} />}>
      <PodcastListingClient
        episodes={episodes}
        total={total}
        perPage={perPage ?? EPISODES_PER_PAGE}
      />
    </Suspense>
  </section>
);

export default PodcastListingSection;
