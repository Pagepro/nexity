// Dev preview origin: SANITY_STUDIO_APP_URL (standalone Studio) or NEXT_PUBLIC_BASE_URL (embedded /admin).
// In production the Studio is embedded at /admin, so the site is same-origin.
const DEV_PREVIEW_ORIGIN = (
  process.env.SANITY_STUDIO_APP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const PREVIEW_ORIGIN = IS_PRODUCTION ? "same-origin" : DEV_PREVIEW_ORIGIN;

export const PREVIEW_URL_PREFIX = IS_PRODUCTION ? "" : DEV_PREVIEW_ORIGIN;
