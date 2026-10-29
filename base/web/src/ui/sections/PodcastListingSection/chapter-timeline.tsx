import { Episode } from "./types";
import { formatDuration, markerClassFor } from "./utils";

interface ChapterTimelineProps {
  episode: Episode;
}

export const ChapterTimeline = ({ episode }: ChapterTimelineProps) => {
  const chapters = episode.chapters ?? [];
  const duration = formatDuration(episode.durationMinutes);
  const markerClass = markerClassFor(episode.topic);

  return (
    <div className="flex h-full flex-1 flex-col gap-8">
      <div className="flex items-center justify-between text-10 font-medium tracking-wider text-muted-foreground uppercase">
        {typeof episode.episodeNumber === "number" && (
          <span>Ep. {episode.episodeNumber}</span>
        )}
        {duration && <span>{duration}</span>}
      </div>

      {chapters.length > 0 && (
        <ol className="relative flex flex-1 flex-col justify-between gap-4 before:absolute before:inset-y-2 before:left-0.75 before:w-px before:bg-border">
          {chapters.map((chapter) => (
            <li key={chapter._key} className="relative flex items-center gap-4">
              <span
                className={`size-1.5 shrink-0 rounded-full ${markerClass}`}
                aria-hidden
              />
              <span className="w-12 shrink-0 text-12 text-muted-foreground tabular-nums">
                {chapter.timestamp}
              </span>
              <span className="text-14 text-foreground lg:text-16">{chapter.title}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
