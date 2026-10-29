// Topic values MUST stay in sync between studio/.../documents/podcast-episode.ts
// (topic.options.list) and this TOPICS array (`value`). They mirror the product
// capabilities (BRAND.md). `value: ""` is the "all" pseudo-topic (disables
// the GROQ topic filter).
export const TOPICS = [
  { slug: "all", label: "All episodes", value: "" },
  { slug: "win-loss", label: "Win/loss", value: "Win/loss" },
  { slug: "attribution", label: "Attribution", value: "Attribution" },
  { slug: "conversation", label: "Conversation", value: "Conversation" },
  { slug: "signals", label: "Signals", value: "Signals" },
  { slug: "revops", label: "RevOps", value: "RevOps" },
] as const;

export const EPISODES_PER_PAGE = 8;

export const PLATFORM_LABELS: Record<string, string> = {
  spotify: "Spotify",
  apple: "Apple Podcasts",
  youtube: "YouTube",
  rss: "RSS",
};

export const LISTING_HEADING = {
  pretitle: "All episodes",
  title: "Every conversation, by topic.",
  intro: "Filter by the capability it covers, or search a guest or a company.",
} as const;
