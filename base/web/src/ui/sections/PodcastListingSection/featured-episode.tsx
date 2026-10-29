import Link from "next/link";

import Image from "@/ui/components/image";

import { ChapterTimeline } from "./chapter-timeline";
import { PersonByline } from "./person-byline";
import { PlatformLinks } from "./platform-links";
import { Episode, PlatformLink } from "./types";
import { formatDuration, formatEpisodeMeta } from "./utils";

interface FeaturedEpisodeProps {
  episode: Episode;
  fallbackLinks: PlatformLink[] | null | undefined;
}

export const FeaturedEpisode = ({ episode, fallbackLinks }: FeaturedEpisodeProps) => {
  const href = episode.slug ? `/podcast/${episode.slug}` : "#";
  const meta = [
    formatEpisodeMeta(episode.episodeNumber, episode.publishedAt),
    formatDuration(episode.durationMinutes),
  ]
    .filter(Boolean)
    .join(" · ");
  const links = episode.platformLinks?.length ? episode.platformLinks : fallbackLinks;

  return (
    <article className="relative overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-16">
        <div className="flex flex-col justify-between gap-8 p-6 lg:basis-5/12 lg:p-10">
          <div className="flex flex-col gap-5">
            <p className="text-10 font-medium tracking-wider text-muted-foreground uppercase">
              Latest episode{meta ? ` · ${meta}` : ""}
            </p>
            <h2 className="text-30 leading-tight font-medium tracking-tight text-balance text-foreground md:text-36">
              <Link href={href} className="transition-colors hover:text-foreground/70">
                {episode.title}
              </Link>
            </h2>
            {episode.summary && (
              <p className="text-16 leading-relaxed text-muted-foreground">
                {episode.summary}
              </p>
            )}
            <PersonByline person={episode.guest} />
          </div>

          <PlatformLinks links={links} size="sm" primaryFirst={false} />
        </div>

        <div className="relative isolate flex min-h-80 flex-col overflow-hidden rounded-sm bg-card-muted p-6 lg:min-h-0 lg:basis-7/12 lg:p-8">
          {episode.coverArt?.image?.asset ? (
            <div className="absolute inset-0">
              <Image
                sanityImage={episode.coverArt}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
                fill
              />
            </div>
          ) : (
            <ChapterTimeline episode={episode} />
          )}
        </div>
      </div>
    </article>
  );
};
