import { bulletList, imageHint, inlineLink, joinBlocks } from "@/lib/markdown/blocks";
import { cleanText, markdownText } from "@/lib/markdown/escape";
import { linkHref } from "@/lib/markdown/links";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import {
  pretitleLine,
  type SectionData,
  type SectionMarkdownSerializer,
} from "@/lib/markdown/sections";
import type { MarkdownContext } from "@/lib/markdown/types";
import { formatListingMeta } from "@/ui/listing/listing-utils";

type FeatureGridCard = NonNullable<
  NonNullable<SectionData<"feature-grid">["cards"]>[number]
>;

const labelledItem = (label: string, title: string, href: string | null) => {
  const linkedTitle = inlineLink(title, href);

  return [label && `**${label}**`, linkedTitle].filter(Boolean).join(": ");
};

// Keep in sync with `toFeatureCard` in utils.ts (rewritten here without `next-sanity`).
const cardItem = (card: FeatureGridCard, context: MarkdownContext): string => {
  if (card._type === "card") {
    const title = markdownText(card.title);
    const href = cleanText(card.link?.type) ? linkHref(card.link, context) : null;

    return title
      ? labelledItem(markdownText(card.eyebrow), title, href)
      : imageHint(card.image);
  }

  if (card._type === "case-study") {
    const title = markdownText(card.title);
    const slug = cleanText(card.slug);
    const label =
      card.category || card.publishedAt
        ? formatListingMeta(cleanText(card.category), card.publishedAt)
        : cleanText(card.eyebrow) || "Case study";
    const href = cleanText(card.link?.type)
      ? linkHref(card.link, context)
      : slug
        ? context.absoluteUrl(`/case-studies/${slug}`)
        : null;

    return labelledItem(markdownText(label), title, href);
  }

  return "";
};

export const featureGridToMarkdown: SectionMarkdownSerializer<
  SectionData<"feature-grid">
> = (section, context) =>
  joinBlocks([
    pretitleLine(section.pretitle),
    portableTextToMarkdown(section.content, context),
    bulletList(
      (section.cards ?? []).map((card) => (card ? cardItem(card, context) : "")),
    ),
  ]);
