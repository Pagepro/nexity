import type { MarkdownContext } from "./types";

export const TEST_ORIGIN = "https://example.com";

export const testContext: MarkdownContext = {
  absoluteUrl: (path) => `${TEST_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`,
  documentUrl: (document, params) => {
    const slug = document.metadata?.slug?.current ?? document.slug?.current;

    return slug ? `${TEST_ORIGIN}/${document._type}/${slug}${params ?? ""}` : null;
  },
};
