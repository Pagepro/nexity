import { stegaClean } from "next-sanity";

const FILE_SIZE_UNITS = ["B", "KB", "MB", "GB"] as const;

export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes < 0) return "";

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    FILE_SIZE_UNITS.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${exponent === 0 ? value : value.toFixed(1)} ${FILE_SIZE_UNITS[exponent]}`;
};

// `?dl=` makes the Sanity CDN answer with Content-Disposition: attachment; the `download`
// attribute alone is ignored for a cross-origin URL.
export const downloadHref = (
  url: string,
  filename: string | null | undefined,
): string => {
  const href = new URL(stegaClean(url));
  href.searchParams.set("dl", stegaClean(filename) || "");
  return href.toString();
};
