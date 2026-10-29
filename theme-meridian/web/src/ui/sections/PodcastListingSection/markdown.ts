import {
  bulletList,
  heading,
  inlineLink,
  joinBlocks,
  labelLine,
  paragraph,
} from "@/lib/markdown/blocks";
import { cleanText, markdownText } from "@/lib/markdown/escape";
import type { SectionMarkdownSerializer } from "@/lib/markdown/sections";
import type { MarkdownContext } from "@/lib/markdown/types";

import { LISTING_HEADING } from "./constants";
import type { Episode, PodcastListingSectionProps } from "./types";
import { formatDuration, formatEpisodeMeta, formatPersonSubtitle } from "./utils";

export const personLine = (
  person:
    | {
        firstName?: string | null;
        lastName?: string | null;
        position?: string | null;
        company?: string | null;
      }
    | null
    | undefined,
): string => {
  const name = [person?.firstName, person?.lastName]
    .map(cleanText)
    .filter(Boolean)
    .join(" ");
  if (!name) return "";

  const subtitle = formatPersonSubtitle(
    cleanText(person?.position),
    cleanText(person?.company),
  );

  return subtitle ? `${name} (${subtitle})` : name;
};

export const episodeListItem = (episode: Episode, context: MarkdownContext): string => {
  const slug = cleanText(episode.slug);
  const url = slug
    ? context.documentUrl({
        _type: "podcast-episode",
        metadata: { slug: { current: slug } },
      })
    : null;
  const meta = [
    formatEpisodeMeta(episode.episodeNumber, episode.publishedAt),
    formatDuration(episode.durationMinutes),
    cleanText(episode.topic),
  ]
    .filter(Boolean)
    .join(" · ");
  const guest = personLine(episode.guest);

  return [
    inlineLink(markdownText(episode.title), url),
    markdownText(meta),
    guest && `Guest: ${markdownText(guest)}`,
    markdownText(episode.summary),
  ]
    .filter(Boolean)
    .join("\n");
};

export const podcastListingToMarkdown: SectionMarkdownSerializer<
  PodcastListingSectionProps
> = (section, context) => {
  const episodes = section.episodes ?? [];

  return joinBlocks([
    labelLine(LISTING_HEADING.pretitle),
    heading(2, LISTING_HEADING.title),
    paragraph(LISTING_HEADING.intro),
    episodes.length
      ? bulletList(episodes.map((episode) => episodeListItem(episode, context)))
      : inlineLink("All episodes", context.absoluteUrl("/podcast")),
  ]);
};
