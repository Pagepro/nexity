import { joinBlocks, presenceHint, textList } from "@/lib/markdown/blocks";
import { cleanText } from "@/lib/markdown/escape";
import { portableTextToMarkdown } from "@/lib/markdown/portable-text";
import {
  pretitleLine,
  type SectionData,
  type SectionMarkdownSerializer,
} from "@/lib/markdown/sections";

const formHint = (section: SectionData<"contact-form">): string => {
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
      "Contact form",
      fields.length ? `fields: ${fields.join(", ")}` : "",
      submit ? `button: ${submit}` : "",
    ]
      .filter(Boolean)
      .join("; ")
      .replace(/[[\]]/g, ""),
  );
};

export const contactFormToMarkdown: SectionMarkdownSerializer<
  SectionData<"contact-form">
> = (section, context) =>
  joinBlocks([
    pretitleLine(section.pretitle),
    portableTextToMarkdown(section.content, context),
    textList(section.bullets),
    formHint(section),
  ]);
