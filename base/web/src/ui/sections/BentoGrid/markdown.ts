import { bulletList, inlineLink, joinBlocks } from "@/lib/markdown/blocks";
import { markdownText } from "@/lib/markdown/escape";
import { ctaList, linkHref } from "@/lib/markdown/links";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import {
  pretitleLine,
  type SectionData,
  type SectionMarkdownSerializer,
} from "@/lib/markdown/sections";

export const bentoGridToMarkdown: SectionMarkdownSerializer<SectionData<"bento-grid">> = (
  section,
  context,
) => {
  const cards = (section.cards ?? []).map((card) => {
    const title = markdownText(card?.title);
    const description = markdownText(card?.description);
    const stat = [markdownText(card?.statLabel), markdownText(card?.statValue)]
      .filter(Boolean)
      .join(": ");
    const href = linkHref(card?.link, context);
    const linkedTitle = href
      ? inlineLink(title || markdownText(card?.link?.label), href)
      : title;

    return [
      [linkedTitle && `**${linkedTitle}**`, description].filter(Boolean).join(": "),
      stat && `(${stat})`,
    ]
      .filter(Boolean)
      .join(" ");
  });

  return joinBlocks([
    pretitleLine(section.pretitle),
    portableTextToMarkdown(section.content, context),
    bulletList(cards),
    ctaList(section.ctas, context),
  ]);
};
