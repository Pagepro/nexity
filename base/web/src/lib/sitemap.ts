// On Vercel a cached route at `/sitemap.xml` (the `app/sitemap.ts` convention) is never purged
// by `revalidateTag`, while the same response under another path is. The body lives at
// `SITEMAP_PATH` and `/sitemap.xml` is rewritten to it, so the public URL stays the same.
export const SITEMAP_PATH = "/sitemaps/all.xml";

export const SITEMAP_REWRITE = {
  source: "/sitemap.xml",
  destination: SITEMAP_PATH,
};

// Keeps `SITEMAP_PATH` from being a second public sitemap URL. Redirects match the incoming path
// only, so the rewrite above never meets this rule.
export const SITEMAP_REDIRECT = {
  source: SITEMAP_PATH,
  destination: SITEMAP_REWRITE.source,
  statusCode: 301 as const,
};

export type SitemapEntry = {
  url: string;
  lastModified?: string | null;
  priority?: number | null;
};

const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!,
  );

export const buildSitemapXml = (entries: SitemapEntry[]): string => {
  const urls = entries.map(({ url, lastModified, priority }) =>
    [
      "<url>",
      `<loc>${escapeXml(url)}</loc>`,
      lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : null,
      priority != null ? `<priority>${priority}</priority>` : null,
      "</url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
};
