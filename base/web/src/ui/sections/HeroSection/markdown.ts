import { imageAlt, joinBlocks } from "@/lib/markdown/blocks";
import { cleanText, markdownText } from "@/lib/markdown/escape";
import { ctaList } from "@/lib/markdown/links";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import {
  pretitleLine,
  type SectionData,
  type SectionMarkdownSerializer,
} from "@/lib/markdown/sections";

const logosLine = (section: SectionData<"hero">): string => {
  const names = (section.logos ?? [])
    .map((logo) => markdownText(imageAlt(logo)))
    .filter(Boolean);
  if (names.length === 0) return "";

  const title = markdownText(section.logosTitle) || "Logos";

  return `${title}: ${names.join(", ")}`;
};

export const heroToMarkdown: SectionMarkdownSerializer<SectionData<"hero">> = (
  section,
  context,
) =>
  joinBlocks([
    pretitleLine(section.pretitle),
    portableTextToMarkdown(section.content, context),
    ctaList(section.ctas, context),
    cleanText(section.layout) === "product-hero" ? logosLine(section) : "",
  ]);
