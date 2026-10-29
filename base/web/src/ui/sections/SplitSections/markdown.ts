import {
  blockquote,
  imageHint,
  joinBlocks,
  labelLine,
  paragraph,
  textList,
} from "@/lib/markdown/blocks";
import { markdownText } from "@/lib/markdown/escape";
import { ctaList } from "@/lib/markdown/links";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import type { SectionData, SectionMarkdownSerializer } from "@/lib/markdown/sections";
import type { MarkdownContext } from "@/lib/markdown/types";

type SplitRow = NonNullable<NonNullable<SectionData<"split-sections">["rows"]>[number]>;

const titledList = (title: unknown, items: (string | null)[] | null | undefined) => {
  const list = textList(items);
  if (!list) return "";

  const label = markdownText(title);

  return joinBlocks([label && `**${label}**`, list]);
};

const rowToMarkdown = (row: SplitRow, context: MarkdownContext): string => {
  const insightLabel = markdownText(row.insight?.label).replace(/:$/, "");
  const insightText = markdownText(row.insight?.text);

  return joinBlocks([
    [labelLine(row.eyebrow), labelLine(row.badge)].filter(Boolean).join(" · "),
    portableTextToMarkdown(row.content, context),
    titledList(row.comparison?.beforeTitle, row.comparison?.beforeItems),
    titledList(row.comparison?.afterTitle, row.comparison?.afterItems),
    titledList(row.bulletsTitle, row.bullets),
    insightText
      ? blockquote(
          [insightLabel && `**${insightLabel}:**`, insightText].filter(Boolean).join(" "),
        )
      : "",
    paragraph(row.proof),
    ctaList(row.ctas, context),
    imageHint(row.image),
  ]);
};

export const splitSectionsToMarkdown: SectionMarkdownSerializer<
  SectionData<"split-sections">
> = (section, context) =>
  joinBlocks((section.rows ?? []).map((row) => (row ? rowToMarkdown(row, context) : "")));
