import { bulletList, joinBlocks, paragraph, table } from "@/lib/markdown/blocks";
import { markdownText } from "@/lib/markdown/escape";
import { ctaLink } from "@/lib/markdown/links";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import {
  pretitleLine,
  type SectionData,
  type SectionMarkdownSerializer,
} from "@/lib/markdown/sections";

import { resolveCell } from "./constants";

export const comparisonTableToMarkdown: SectionMarkdownSerializer<
  SectionData<"comparison-table">
> = (section, context) => {
  const plans = (section.plans ?? []).filter(Boolean);
  const groups = (section.featureGroups ?? []).filter(Boolean);
  if (plans.length === 0) return "";

  const header = ["Feature", ...plans.map((plan) => markdownText(plan.name))];
  const priceRow = [
    "Price",
    ...plans.map((plan) =>
      [markdownText(plan.price), markdownText(plan.priceSuffix)]
        .filter(Boolean)
        .join(" "),
    ),
  ];
  const rows = groups.flatMap((group) => {
    const title = markdownText(group.title);
    const description = markdownText(group.description);
    const groupRow = title
      ? [
          [`**${title}**`, description].filter(Boolean).join(" — "),
          ...plans.map(() => ""),
        ]
      : null;
    const featureRows = (group.rows ?? []).map((row) => {
      const label = markdownText(row?.label);
      const hint = markdownText(row?.hint);

      return [
        hint ? `${label} (${hint})` : label,
        ...plans.map((_, index) => markdownText(resolveCell(row?.cells?.[index]).label)),
      ];
    });

    return groupRow ? [groupRow, ...featureRows] : featureRows;
  });
  const hasPrices = priceRow.slice(1).some(Boolean);
  const planCtas = bulletList(
    plans.map((plan) => {
      const link = ctaLink(plan.cta, context);
      const name = markdownText(plan.name);

      return link && name ? `${name}: ${link}` : link;
    }),
  );

  return joinBlocks([
    pretitleLine(section.pretitle),
    portableTextToMarkdown(section.content, context),
    table(header, hasPrices ? [priceRow, ...rows] : rows),
    planCtas,
    paragraph(section.footnote),
  ]);
};
