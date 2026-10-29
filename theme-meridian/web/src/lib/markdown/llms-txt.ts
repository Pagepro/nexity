import { bulletList, inlineLink, joinBlocks } from "./blocks";
import { cleanText, markdownText } from "./escape";
import type { MarkdownLinkedDocument } from "./types";

export interface LlmsTxtDocument extends MarkdownLinkedDocument {
  title?: string | null;
  metadata?:
    | (MarkdownLinkedDocument["metadata"] & {
        title?: string | null;
        description?: string | null;
      })
    | null;
  summary?: string | null;
}

export interface LlmsTxtData {
  site?: { title?: string | null; description?: string | null } | null;
  pages?: LlmsTxtDocument[] | null;
  listings?: LlmsTxtDocument[] | null;
  posts?: LlmsTxtDocument[] | null;
  caseStudies?: LlmsTxtDocument[] | null;
  episodes?: LlmsTxtDocument[] | null;
}

export const LLMS_FALLBACK_TITLE = "Website";

const entry = (
  document: LlmsTxtDocument,
  markdownUrlFor: (document: LlmsTxtDocument) => string | null,
): string => {
  const url = markdownUrlFor(document);
  const title = markdownText(
    cleanText(document.metadata?.title) || cleanText(document.title),
  );
  if (!url || !title) return "";

  const description = markdownText(
    cleanText(document.metadata?.description) || cleanText(document.summary),
  ).replace(/\s*\n\s*/g, " ");

  return description
    ? `${inlineLink(title, url)}: ${description}`
    : inlineLink(title, url);
};

const group = (
  title: string,
  documents: (LlmsTxtDocument | null | undefined)[],
  markdownUrlFor: (document: LlmsTxtDocument) => string | null,
) => {
  const list = bulletList(
    documents.map((document) => (document ? entry(document, markdownUrlFor) : "")),
  );

  return list ? joinBlocks([`## ${title}`, list]) : "";
};

const listingOf = (data: LlmsTxtData, type: string) =>
  (data.listings ?? []).filter((listing) => cleanText(listing?._type) === type);

export const buildLlmsTxt = (
  data: LlmsTxtData,
  markdownUrlFor: (document: LlmsTxtDocument) => string | null,
): string => {
  const title = markdownText(data.site?.title) || LLMS_FALLBACK_TITLE;
  const description = markdownText(data.site?.description).replace(/\s*\n\s*/g, " ");

  return `${joinBlocks([
    `# ${title}`,
    description && `> ${description}`,
    "Every page below is also served as Markdown: add `.md` to its URL (the homepage is `/index.md`) or request it with `Accept: text/markdown`. Listing pages hold every item in one file.",
    group("Pages", data.pages ?? [], markdownUrlFor),
    group(
      "Blog",
      [...listingOf(data, "blog-listing-page"), ...(data.posts ?? [])],
      markdownUrlFor,
    ),
    group(
      "Case studies",
      [...listingOf(data, "case-studies-listing-page"), ...(data.caseStudies ?? [])],
      markdownUrlFor,
    ),
    group(
      "Podcast",
      [...listingOf(data, "podcast-listing-page"), ...(data.episodes ?? [])],
      markdownUrlFor,
    ),
  ])}\n`;
};
