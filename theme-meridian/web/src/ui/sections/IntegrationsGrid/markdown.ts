import { INTEGRATION_CATEGORIES } from "@/consts/integration-categories";
import { bulletList, joinBlocks } from "@/lib/markdown/blocks";
import { cleanText, markdownText } from "@/lib/markdown/escape";
import { ctaList } from "@/lib/markdown/links";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import {
  pretitleLine,
  type SectionData,
  type SectionMarkdownSerializer,
} from "@/lib/markdown/sections";

export const integrationsGridToMarkdown: SectionMarkdownSerializer<
  SectionData<"integrations-grid">
> = (section, context) => {
  const integrations = (section.integrations ?? []).filter((item) =>
    markdownText(item?.name),
  );
  const namesIn = (category: string | null) =>
    integrations
      .filter((item) => cleanText(item.category) === (category ?? ""))
      .map((item) => markdownText(item.name))
      .join(", ");

  const knownValues = new Set<string>(
    INTEGRATION_CATEGORIES.map((category) => category.value),
  );
  const lines = INTEGRATION_CATEGORIES.map((category) => {
    const names = namesIn(category.value);

    return names ? `**${category.title}**: ${names}` : "";
  });
  const uncategorised = integrations
    .filter((item) => !knownValues.has(cleanText(item.category)))
    .map((item) => markdownText(item.name))
    .join(", ");

  return joinBlocks([
    pretitleLine(section.pretitle),
    portableTextToMarkdown(section.content, context),
    bulletList([...lines, uncategorised && `**Other**: ${uncategorised}`]),
    ctaList(section.ctas, context),
  ]);
};
