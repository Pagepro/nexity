import { imageHint, joinBlocks } from "@/lib/markdown/blocks";
import { cleanText } from "@/lib/markdown/escape";
import { ctaList } from "@/lib/markdown/links";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import type { SectionData, SectionMarkdownSerializer } from "@/lib/markdown/sections";

type FeatureBlock = SectionData<"feature-block">;

const renderedImages = (section: FeatureBlock) => {
  const images = section.images ?? [];
  const layout = cleanText(section.imageLayout);

  if (layout === "single") return images.slice(0, 1);

  return layout === "grid" || layout === "hero-overlap" ? images : [];
};

export const featureBlockToMarkdown: SectionMarkdownSerializer<FeatureBlock> = (
  section,
  context,
) =>
  joinBlocks([
    portableTextToMarkdown(section.content, context),
    ctaList(section.ctas, context),
    ...renderedImages(section).map((image) => imageHint(image)),
  ]);
