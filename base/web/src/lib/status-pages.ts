// `/404` and `/500` serve Next's built-in pages, which skip the `(frontend)` layout (there is no
// root `app/layout`). Rewritten to a path no page has, they reach the catchall's `notFound()`
// and get the site's 404 with header and footer. Never rewrite to `/404`: that is the CMS
// "404" page's slug and would answer 200.
export const STATUS_PAGE_REWRITES = ["/404", "/500"].map((source) => ({
  source,
  destination: "/status-page-not-found",
}));
