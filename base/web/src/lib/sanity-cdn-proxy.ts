// Serves Sanity CDN files (SVG logos skip the image optimizer) from our own origin, saving a
// second-origin handshake that PageSpeed charges to LCP (~0.6 s). `proxy.ts` skips this prefix.
// Vercel projects created before 6 April 2026 ignore the CDN's cache-control on rewrites
// without `x-vercel-enable-rewrite-caching: 1`: keep this path in sync with `web/vercel.json`.
export const SANITY_CDN_PROXY_PREFIX = "/cdn-sanity";

const SANITY_CDN_ORIGIN = "https://cdn.sanity.io";

export const SANITY_CDN_REWRITE = {
  source: `${SANITY_CDN_PROXY_PREFIX}/:path*`,
  destination: `${SANITY_CDN_ORIGIN}/:path*`,
};

export const toSameOriginCdnUrl = (url: string): string =>
  url.startsWith(`${SANITY_CDN_ORIGIN}/`)
    ? `${SANITY_CDN_PROXY_PREFIX}${url.slice(SANITY_CDN_ORIGIN.length)}`
    : url;
