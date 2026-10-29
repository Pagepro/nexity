import { joinBlocks, presenceHint } from "@/lib/markdown/blocks";
import { cleanText } from "@/lib/markdown/escape";
import { ctaList } from "@/lib/markdown/links";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import type { SectionData, SectionMarkdownSerializer } from "@/lib/markdown/sections";

export const newsletterToMarkdown: SectionMarkdownSerializer<
  SectionData<"newsletter">
> = (section, context) => {
  const submit = cleanText(section.submitLabel);

  return joinBlocks([
    portableTextToMarkdown(section.content, context),
    presenceHint(
      ["Newsletter signup form (email)", submit ? `button: ${submit}` : ""]
        .filter(Boolean)
        .join("; ")
        .replace(/[[\]]/g, ""),
    ),
    portableTextToMarkdown(section.socialProof, context),
    ctaList(section.ctas, context),
  ]);
};
