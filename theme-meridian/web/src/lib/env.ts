import { resolveIsIndexable } from "./seo-robots";

export const dev = process.env.NODE_ENV !== "production";

if (!process.env.NEXT_PUBLIC_BASE_URL) {
  throw new Error(
    "Missing NEXT_PUBLIC_BASE_URL: set it to the site URL, including https://.",
  );
}

export const BASE_URL = dev ? "http://localhost:3000" : process.env.NEXT_PUBLIC_BASE_URL!;

// Server-only, read at module scope: changing it needs a redeploy.
export const IS_INDEXABLE = resolveIsIndexable({
  isIndexableFlag: process.env.IS_INDEXABLE,
  deploymentEnv: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV,
});
