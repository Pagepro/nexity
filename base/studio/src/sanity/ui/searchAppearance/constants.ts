// Duplicated from web/src/lib/resolveUrl.ts (the web package can't be imported here).
// KEEP IN SYNC with resolveUrl.ts, the app route folders and presentation.ts.

export const ROUTED_DETAIL_PREFIXES: Record<string, string> = {
  post: "/blog",
  "case-study": "/case-studies",
};

export const FIXED_PATHS: Record<string, string> = {
  "blog-listing-page": "/blog",
  "case-studies-listing-page": "/case-studies",
};

export const DEVICES = ["mobile", "desktop"] as const;

export type Device = (typeof DEVICES)[number];

// Approximates Google's pixel-width truncation; keep mobile <= desktop.
export const TITLE_LIMIT = { desktop: 60, mobile: 55 } satisfies Record<Device, number>;
export const DESCRIPTION_LIMIT = { desktop: 160, mobile: 120 } satisfies Record<
  Device,
  number
>;
