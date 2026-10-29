import { textList } from "@/lib/markdown/blocks";
import type { SectionData, SectionMarkdownSerializer } from "@/lib/markdown/sections";

export const trustBadgesToMarkdown: SectionMarkdownSerializer<
  SectionData<"trust-badges">
> = (section) => textList((section.badges ?? []).map((badge) => badge?.label));
