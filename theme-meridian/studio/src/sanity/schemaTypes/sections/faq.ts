import { VscQuestion } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import { formatCount, getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "faq",
  title: "FAQ",
  icon: VscQuestion,
  type: "object",
  groups: [{ name: "content", default: true }, { name: "options" }],
  fields: [
    defineField({
      name: "options",
      title: "Section options",
      type: "section-options",
      group: "options",
    }),
    defineField({
      name: "pretitle",
      title: "Tagline",
      description: "Short uppercase label above the heading, e.g. “FAQ”.",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "content",
      title: "Content",
      description:
        "Section heading and supporting copy. Use the “Section Heading L” style for the heading.",
      type: "simpleRichText",
      group: "content",
    }),
    defineField({
      name: "ctas",
      title: "Call-to-actions",
      description: "Optional contact button shown beside the heading, e.g. “Talk to us”.",
      type: "array",
      of: [{ type: "cta" }],
      group: "content",
      validation: (Rule) =>
        Rule.max(2).warning("The FAQ layout is designed for up to 2 buttons."),
    }),
    defineField({
      name: "items",
      title: "Questions",
      description: "Renders as a 2-column list (question left, answer right) on desktop.",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
          fields: [
            defineField({
              name: "question",
              title: "Question",
              type: "string",
              validation: (Rule) => Rule.required().error("Each item needs a question."),
            }),
            defineField({
              name: "answer",
              title: "Answer",
              type: "text",
              rows: 3,
              validation: (Rule) => Rule.required().error("Each item needs an answer."),
            }),
          ],
          preview: {
            select: { title: "question", subtitle: "answer" },
            prepare: ({ title, subtitle }) => ({
              title: title || "Question",
              subtitle,
            }),
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1).error("Add at least one question."),
    }),
  ],
  preview: {
    select: { content: "content", items: "items" },
    prepare: ({ content, items }) => ({
      title: getPlainText(content) || "FAQ",
      subtitle: items?.length ? formatCount(items, "question") : "FAQ",
    }),
  },
});
