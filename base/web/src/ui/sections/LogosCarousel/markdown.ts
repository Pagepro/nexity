import { imageAlt } from "@/lib/markdown/blocks";
import { markdownText } from "@/lib/markdown/escape";
import type { SectionData, SectionMarkdownSerializer } from "@/lib/markdown/sections";

export const logosCarouselToMarkdown: SectionMarkdownSerializer<
  SectionData<"logos-carousel">
> = (section) => {
  const names = (section.logos ?? [])
    .map((logo) => markdownText(imageAlt(logo)))
    .filter(Boolean);

  return names.length ? `Logos: ${names.join(", ")}` : "";
};
