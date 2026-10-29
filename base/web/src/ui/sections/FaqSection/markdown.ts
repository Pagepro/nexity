import { heading, joinBlocks, paragraph } from "@/lib/markdown/blocks";
import { markdownText } from "@/lib/markdown/escape";
import { ctaList } from "@/lib/markdown/links";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import {
  pretitleLine,
  type SectionData,
  type SectionMarkdownSerializer,
} from "@/lib/markdown/sections";

export const faqToMarkdown: SectionMarkdownSerializer<SectionData<"faq">> = (
  section,
  context,
) => {
  const items = (section.items ?? []).filter((item) => markdownText(item?.question));
  if (items.length === 0) return "";

  return joinBlocks([
    pretitleLine(section.pretitle),
    portableTextToMarkdown(section.content, context),
    ctaList(section.ctas, context),
    ...items.map((item) =>
      joinBlocks([heading(3, markdownText(item.question)), paragraph(item.answer)]),
    ),
  ]);
};
