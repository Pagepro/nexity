import { joinBlocks } from "@/lib/markdown/blocks";
import { ctaList } from "@/lib/markdown/links";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import type { SectionData, SectionMarkdownSerializer } from "@/lib/markdown/sections";

export const textBlockToMarkdown: SectionMarkdownSerializer<SectionData<"text-block">> = (
  section,
  context,
) =>
  joinBlocks([
    portableTextToMarkdown(section.content, context),
    ctaList(section.ctas, context),
  ]);
