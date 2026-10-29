import { bulletList, inlineLink } from "./blocks";
import { cleanText, markdownText } from "./escape";
import type { MarkdownContext, MarkdownCta, MarkdownLink } from "./types";

// Mirrors `BaseLink`. Internal links point at the HTML pages, not their `.md` twins:
// the HTML URL is the canonical one.
export const linkHref = (
  link: MarkdownLink | null | undefined,
  context: MarkdownContext,
): string | null => {
  const params = cleanText(link?.params) || null;

  switch (cleanText(link?.type)) {
    case "internal":
      return link?.internal ? context.documentUrl(link.internal, params) : null;
    case "path": {
      const path = cleanText(link?.internalPath);

      return path ? context.absoluteUrl(`${path}${params ?? ""}`) : null;
    }
    case "external":
      return cleanText(link?.external) || null;
    case "download":
      return cleanText(link?.file?.asset?.url) || null;
    default:
      return null;
  }
};

export const ctaLink = (
  cta: MarkdownCta | null | undefined,
  context: MarkdownContext,
): string => {
  if (!cta?.link) return "";

  const label = markdownText(cta.link.label);
  const href = linkHref(cta.link, context);
  if (!href) return label;

  return inlineLink(label, href);
};

export const ctaList = (
  ctas: (MarkdownCta | null | undefined)[] | null | undefined,
  context: MarkdownContext,
): string => bulletList((ctas ?? []).map((cta) => ctaLink(cta, context)));
