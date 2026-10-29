import { BASE_URL } from "@/lib/env";
import resolveUrl, { ensureLeadingSlash } from "@/lib/resolveUrl";

import type { MarkdownContext } from "./types";

// Reads env, so it must stay out of the pure (tested) markdown modules; they take a context instead.
export const markdownContext: MarkdownContext = {
  absoluteUrl: (path) =>
    /^[a-z][a-z\d+.-]*:/i.test(path) ? path : `${BASE_URL}${ensureLeadingSlash(path)}`,
  documentUrl: (document, params) => {
    const url = resolveUrl(
      {
        _type: document._type ?? undefined,
        metadata: document.metadata?.slug?.current
          ? { slug: { _type: "slug", current: document.metadata.slug.current } }
          : null,
      },
      { params },
    );

    // `resolveUrl` returns the bare origin when the document has no path.
    return url && url !== BASE_URL ? url : null;
  },
};
