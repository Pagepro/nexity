import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Episode } from "./types";
import {
  formatDuration,
  formatEpisodeMeta,
  formatPersonSubtitle,
  markerClassFor,
} from "./utils";

interface EpisodeRowProps {
  episode: Episode;
}

const EpisodeRow = ({ episode }: EpisodeRowProps) => {
  const href = episode.slug ? `/podcast/${episode.slug}` : "#";
  const meta = formatEpisodeMeta(episode.episodeNumber, episode.publishedAt);
  const duration = formatDuration(episode.durationMinutes);
  const guestName = episode.guest
    ? [episode.guest.firstName, episode.guest.lastName].filter(Boolean).join(" ")
    : null;
  const guestSubtitle = episode.guest
    ? formatPersonSubtitle(episode.guest.position, episode.guest.company)
    : null;
  const markerClass = markerClassFor(episode.topic);

  return (
    <Link
      href={href}
      className="group episode-row items-center gap-x-4 gap-y-2 border-b border-border py-6 md:gap-8"
    >
      <span className="episode-row-n text-12 tracking-wider text-muted-foreground uppercase tabular-nums">
        {meta}
      </span>

      <span className="episode-row-main flex min-w-0 flex-col gap-1.5">
        <span className="text-16 font-medium text-balance text-foreground transition-colors group-hover:text-foreground/70">
          {episode.title}
        </span>
        {guestName && (
          <span className="text-14 text-muted-foreground">
            {guestName}
            {guestSubtitle ? `, ${guestSubtitle}` : ""}
          </span>
        )}
      </span>

      {episode.topic && (
        <span className="episode-row-k flex items-center gap-2 text-10 font-medium tracking-wider text-muted-foreground uppercase">
          <span className={`size-1.5 shrink-0 ${markerClass}`} aria-hidden />
          {episode.topic}
        </span>
      )}

      <span className="episode-row-side flex items-center justify-end gap-6">
        {duration && (
          <span className="text-12 text-muted-foreground tabular-nums">{duration}</span>
        )}
        <span className="flex size-6 items-center justify-center rounded-full bg-foreground transition-all group-hover:translate-x-0.5">
          <ArrowRight className="size-3.5 text-background" aria-hidden />
        </span>
      </span>
    </Link>
  );
};

export default EpisodeRow;
