import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import type { SectionData, SectionMarkdownSerializer } from "@/lib/markdown/sections";

export const contentToMarkdown: SectionMarkdownSerializer<SectionData<"content">> = (
  section,
  context,
) => portableTextToMarkdown(section.content, context);
