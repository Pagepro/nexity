import { ACCENT_MARKER_CLASSES } from "@/ui/sections/SplitSections/constants";

import { TOPICS } from "./constants";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const formatEpisodeMeta = (
  episodeNumber: number | null | undefined,
  publishedAt: string | null | undefined,
): string => {
  const parts: string[] = [];

  if (typeof episodeNumber === "number") parts.push(`Ep. ${episodeNumber}`);
  if (publishedAt) parts.push(DATE_FORMATTER.format(new Date(publishedAt)));

  return parts.join(" · ");
};

export const formatDuration = (minutes: number | null | undefined): string | null =>
  typeof minutes === "number" && minutes > 0 ? `${Math.round(minutes)} min` : null;

export const markerClassFor = (topic: string | null | undefined): string => {
  const position = TOPICS.findIndex((entry) => entry.value === topic);

  return ACCENT_MARKER_CLASSES[Math.max(position - 1, 0) % ACCENT_MARKER_CLASSES.length];
};

export const formatPersonSubtitle = (
  position: string | null | undefined,
  company: string | null | undefined,
): string => [position, company].filter(Boolean).join(", ");
