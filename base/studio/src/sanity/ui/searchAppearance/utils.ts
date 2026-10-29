import {
  DESCRIPTION_LIMIT,
  type Device,
  FIXED_PATHS,
  ROUTED_DETAIL_PREFIXES,
  TITLE_LIMIT,
} from "./constants";

export const ensureLeadingSlash = (url: string): string =>
  url.startsWith("/") ? url : `/${url}`;

/** Bare hostname from a base URL ("https://example.com" → "example.com"). */
export const hostnameFromBaseUrl = (baseUrl: string): string => {
  if (!baseUrl) return "";
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return baseUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  }
};

// Mirrors web/src/lib/resolveUrl.ts.
export const resolveStudioUrl = ({
  type,
  metadataSlug,
  canonical,
}: {
  type?: string;
  metadataSlug?: string;
  canonical?: string;
}): string => {
  if (canonical?.trim()) return canonical.trim();

  const fixedPath = type ? FIXED_PATHS[type] : undefined;
  if (fixedPath) return fixedPath;

  const prefix = type ? ROUTED_DETAIL_PREFIXES[type] : undefined;
  if (prefix) return metadataSlug ? `${prefix}/${metadataSlug}` : prefix;

  return metadataSlug ? ensureLeadingSlash(metadataSlug) : "";
};

export const formatBreadcrumb = (baseUrl: string, resolved: string): string => {
  let host = hostnameFromBaseUrl(baseUrl);
  let path = resolved;

  if (/^https?:\/\//.test(resolved)) {
    try {
      const url = new URL(resolved);
      host = url.hostname;
      path = url.pathname;
    } catch {
      // fall through with the raw string
    }
  }

  const segments = path.split("/").filter(Boolean);
  return [host, ...segments].filter(Boolean).join(" › ");
};

const truncate = (text: string, limit: number): string =>
  text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;

export const truncateTitle = (text: string, device: Device): string =>
  truncate(text, TITLE_LIMIT[device]);

export const truncateDescription = (text: string, device: Device): string =>
  truncate(text, DESCRIPTION_LIMIT[device]);

export const formatSerpDate = (value?: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};
