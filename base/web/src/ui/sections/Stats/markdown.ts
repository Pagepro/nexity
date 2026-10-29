import { bulletList, joinBlocks } from "@/lib/markdown/blocks";
import { cleanText, markdownText } from "@/lib/markdown/escape";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import type { SectionData, SectionMarkdownSerializer } from "@/lib/markdown/sections";

export const statsToMarkdown: SectionMarkdownSerializer<SectionData<"stats">> = (
  section,
  context,
) => {
  const stats = bulletList(
    (section.stats ?? []).map((stat) => {
      const value = markdownText(stat?.value);
      const label = markdownText(stat?.label);

      return [value && `**${value}**`, label].filter(Boolean).join(" ");
    }),
  );
  if (!stats) return "";

  return joinBlocks([
    cleanText(section.layout) === "band"
      ? ""
      : portableTextToMarkdown(section.content, context),
    stats,
  ]);
};
