import "server-only";

// Both optional: without the read token draft mode is off; without the preview
// token the visual editor doesn't update live.
export const token = process.env.SANITY_API_READ_TOKEN;
export const browserToken = process.env.SANITY_PREVIEW_TOKEN;
