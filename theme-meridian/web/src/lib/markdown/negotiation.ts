// Keep free of imports: `proxy.ts` runs this on every request.

const MARKDOWN_MEDIA_TYPE = "text/markdown";
const MARKDOWN_SUFFIX = ".md";

export const MARKDOWN_ROUTE = "/api/markdown";

const EXCLUDED_PREFIXES = ["/.well-known/", "/_next/", "/api/", "/admin"];

export interface MarkdownRequest {
  contentPath: string;
  via: "suffix" | "accept";
}

interface AcceptEntry {
  type: string;
  quality: number;
}

const parseAccept = (accept: string): AcceptEntry[] =>
  accept
    .split(",")
    .map((part) => {
      const [type = "", ...parameters] = part.split(";").map((piece) => piece.trim());
      const qualityParameter = parameters.find((parameter) => /^q=/i.test(parameter));
      const quality = qualityParameter ? Number(qualityParameter.slice(2)) : 1;

      return { type: type.toLowerCase(), quality };
    })
    .filter(
      ({ type, quality }) =>
        type && Number.isFinite(quality) && quality >= 0 && quality <= 1,
    );

// Wildcards don't count, so a browser's `text/html,…,*\/*;q=0.8` keeps getting HTML.
export const prefersMarkdown = (accept: string | null | undefined): boolean => {
  if (!accept) return false;

  const entries = parseAccept(accept);
  const qualityOf = (type: string) =>
    Math.max(
      0,
      ...entries.filter((entry) => entry.type === type).map((entry) => entry.quality),
    );
  const markdownQuality = qualityOf(MARKDOWN_MEDIA_TYPE);

  return markdownQuality > 0 && markdownQuality >= qualityOf("text/html");
};

export const normalizeContentPath = (path: string): string => {
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  const trimmed = withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;

  return trimmed === "" || trimmed === "/index" ? "/" : trimmed;
};

export const markdownPathFor = (contentPath: string): string => {
  const path = normalizeContentPath(contentPath);

  return path === "/" ? `/index${MARKDOWN_SUFFIX}` : `${path}${MARKDOWN_SUFFIX}`;
};

export const markdownRoutePathFor = (contentPath: string): string => {
  const path = normalizeContentPath(contentPath);

  return path === "/" ? MARKDOWN_ROUTE : `${MARKDOWN_ROUTE}${path}`;
};

export const markdownRequestFor = (
  pathname: string,
  accept: string | null | undefined,
): MarkdownRequest | null => {
  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  if (pathname.endsWith(MARKDOWN_SUFFIX)) {
    return {
      contentPath: normalizeContentPath(pathname.slice(0, -MARKDOWN_SUFFIX.length)),
      via: "suffix",
    };
  }

  // `/logo.png` or `/llms.txt` with a Markdown-first Accept is still that file.
  const lastSegment = pathname.split("/").pop() ?? "";
  if (lastSegment.includes(".")) return null;

  return prefersMarkdown(accept)
    ? { contentPath: normalizeContentPath(pathname), via: "accept" }
    : null;
};
