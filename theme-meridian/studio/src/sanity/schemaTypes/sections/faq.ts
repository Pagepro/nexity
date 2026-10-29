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
  initialValue: {
    pretitle: "FAQ",
    content: [
      {
        _key: "block_1",
        _type: "block",
        style: "section-heading-lg",
        children: [
          { _key: "block_1_span_1", _type: "span", text: "Questions, answered" },
        ],
      },
      {
        _key: "block_2",
        _type: "block",
        style: "body-2",
        children: [
          {
            _key: "block_2_span_1",
            _type: "span",
            text: "We've answered the ones we hear most. If yours isn't here, talk to us.",
          },
        ],
      },
    ],
    items: [
      {
        _key: "item_1",
        _type: "faqItem",
        question: "How does Meridian connect to my CRM?",
        answer:
          "We integrate directly with Cumulo and Harborline via native connectors. Setup takes under 30 minutes with no engineering required.",
      },
      {
        _key: "item_2",
        _type: "faqItem",
        question: "What data does Meridian need to get started?",
        answer:
          "CRM deal data is enough to generate your first win/loss report. Content attribution and deal signals improve as you connect additional sources like email, calls, and your CMS.",
      },
      {
        _key: "item_3",
        _type: "faqItem",
        question: "How long before I see results?",
        answer:
          "Most teams have their first insight report within 24 hours of connecting their CRM. Trend data becomes meaningful after 30–60 days.",
      },
      {
        _key: "item_4",
        _type: "faqItem",
        question: "Is my data secure?",
        answer:
          "Yes. Meridian is SOC 2 Type II certified and GDPR compliant. Your data is never used to train models or shared with third parties.",
      },
      {
        _key: "item_5",
        _type: "faqItem",
        question: "Can I cancel anytime?",
        answer:
          "Yes. Month-to-month plans can be cancelled at any time. Annual plans are refunded on a pro-rata basis within the first 30 days.",
      },
    ],
  },
});
