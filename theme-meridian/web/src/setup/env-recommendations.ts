// Missing ones warn, never fail: a fresh project must boot to show the Next steps
// screen. Only names leave this module, never values.
export const RECOMMENDED_ENV = [
  {
    name: "SANITY_API_READ_TOKEN",
    purpose:
      "Draft mode, the visual editor and its live updates. A private dataset can't be read without it either.",
  },
  {
    name: "SANITY_REVALIDATE_SECRET",
    purpose:
      "Signs the revalidate webhook. Without it a published change waits up to 30 days for the cache.",
  },
] as const;

export type RecommendedEnvName = (typeof RECOMMENDED_ENV)[number]["name"];

export const getMissingRecommendedEnv = (
  env: Record<string, string | undefined> = process.env,
) => RECOMMENDED_ENV.filter(({ name }) => !env[name]?.trim());
