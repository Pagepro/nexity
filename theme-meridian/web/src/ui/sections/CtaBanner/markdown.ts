import { imageHint, joinBlocks } from "@/lib/markdown/blocks";
import { ctaList } from "@/lib/markdown/links";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import type { SectionData, SectionMarkdownSerializer } from "@/lib/markdown/sections";

export const ctaBannerToMarkdown: SectionMarkdownSerializer<SectionData<"cta-banner">> = (
  section,
  context,
) =>
  joinBlocks([
    portableTextToMarkdown(section.content, context),
    imageHint(section.image),
    ctaList(section.ctas, context),
  ]);
