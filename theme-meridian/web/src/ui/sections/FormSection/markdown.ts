import { joinBlocks, presenceHint, textList } from "@/lib/markdown/blocks";
import { cleanText } from "@/lib/markdown/escape";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import {
  pretitleLine,
  type SectionData,
  type SectionMarkdownSerializer,
} from "@/lib/markdown/sections";

// The gated resource never reaches this serializer: the page query carries only its id.
const formHint = (section: SectionData<"form">): string => {
  const choices = (section.teamSizeField?.choices ?? []).map(cleanText).filter(Boolean);
  const teamSize = cleanText(section.teamSizeField?.label);
  const fields = [
    cleanText(section.nameField?.label),
    cleanText(section.emailField?.label),
    cleanText(section.companyField?.label),
    teamSize && choices.length ? `${teamSize} (${choices.join(", ")})` : teamSize,
    cleanText(section.messageField?.label),
  ].filter(Boolean);
  const submit = cleanText(section.submitLabel);

  return presenceHint(
    [
      cleanText(section.formType) === "gated" ? "Download form" : "Contact form",
      fields.length ? `fields: ${fields.join(", ")}` : "",
      submit ? `button: ${submit}` : "",
    ]
      .filter(Boolean)
      .join("; ")
      .replace(/[[\]]/g, ""),
  );
};

export const formToMarkdown: SectionMarkdownSerializer<SectionData<"form">> = (
  section,
  context,
) =>
  joinBlocks([
    pretitleLine(section.pretitle),
    portableTextToMarkdown(section.content, context),
    textList(section.bullets),
    formHint(section),
  ]);
