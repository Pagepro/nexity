import "server-only";

// Optional: without it draft mode is off. <SanityLive /> also hands it to the
// browser for live updates, which next-sanity does only in draft mode.
export const token = process.env.SANITY_API_READ_TOKEN;
