// Everything in `lib/markdown/` except `server-context.ts` and `load-markdown.ts` must stay
// pure (no React, no `@/` value import) so the `*.test.mts` runner can load it.

export interface MarkdownSlug {
  current?: string | null;
}

export interface MarkdownLinkedDocument {
  _type?: string | null;
  metadata?: { slug?: MarkdownSlug | null } | null;
  slug?: MarkdownSlug | null;
}

export interface MarkdownLink {
  type?: string | null;
  external?: string | null;
  internalPath?: string | null;
  params?: string | null;
  label?: string | null;
  internal?: MarkdownLinkedDocument | null;
  file?: { asset?: { url?: string | null } | null } | null;
}

export interface MarkdownCta {
  link?: MarkdownLink | null;
}

export interface MarkdownImage {
  alt?: string | null;
  role?: string | null;
  image?: { asset?: { altText?: string | null } | null } | null;
}

export interface MarkdownContext {
  absoluteUrl: (path: string) => string;
  documentUrl: (
    document: MarkdownLinkedDocument,
    params?: string | null,
  ) => string | null;
  /** `_key` of the block already used as the `#` title (a hero's `heading-1`), so it isn't repeated. */
  skipBlockKey?: string | null;
}
