import { bulletList, heading, inlineLink, joinBlocks } from "@/lib/markdown/blocks";
import { cleanText, markdownText } from "@/lib/markdown/escape";
import type { SectionMarkdownSerializer } from "@/lib/markdown/sections";
import type { MarkdownContext } from "@/lib/markdown/types";
import { formatListingMeta } from "@/ui/listing/listing-utils";

import { LISTING_HEADING } from "./constants";
import type { CaseStudiesListingSectionProps, CaseStudy } from "./types";

export const caseStudyListItem = (
  caseStudy: CaseStudy,
  context: MarkdownContext,
): string => {
  const slug = cleanText(caseStudy.slug);
  const url = slug
    ? context.documentUrl({ _type: "case-study", metadata: { slug: { current: slug } } })
    : null;
  const meta =
    formatListingMeta(cleanText(caseStudy.category), caseStudy.publishedAt) ||
    cleanText(caseStudy.eyebrow);
  const metrics = (caseStudy.metrics ?? [])
    .map((metric) =>
      [markdownText(metric?.value), markdownText(metric?.label)]
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean)
    .join(", ");

  return [
    inlineLink(markdownText(caseStudy.title), url),
    markdownText(meta),
    markdownText(caseStudy.excerpt),
    metrics && `Results: ${metrics}`,
  ]
    .filter(Boolean)
    .join("\n");
};

export const caseStudiesListingToMarkdown: SectionMarkdownSerializer<
  CaseStudiesListingSectionProps
> = (section, context) => {
  const caseStudies = section.caseStudies ?? [];

  return joinBlocks([
    heading(2, LISTING_HEADING),
    caseStudies.length
      ? bulletList(caseStudies.map((caseStudy) => caseStudyListItem(caseStudy, context)))
      : inlineLink("All case studies", context.absoluteUrl("/case-studies")),
  ]);
};
