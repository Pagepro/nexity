import { VscLayoutPanelJustify } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import { formatCount, getPlainText } from "@/sanity/lib/utils";

import { featureIcon } from "../fragments/fields/feature-icon";

export default defineType({
  name: "bento-grid",
  title: "Bento grid",
  icon: VscLayoutPanelJustify,
  type: "object",
  groups: [
    { name: "content", title: "Heading", default: true },
    { name: "items", title: "Cards" },
    { name: "links", title: "Links" },
    { name: "options" },
  ],
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
      description: "Small uppercase label above the heading (e.g. “Capabilities”).",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "content",
      title: "Content",
      description:
        "Section heading and optional supporting copy. Use the section-heading-lg block style for the heading.",
      type: "simpleRichText",
      group: "content",
    }),
    defineField({
      name: "cardStyle",
      title: "Card style",
      description:
        "Card = framed cards, icon on top, on a 4-column grid (wide cards span 2). Plain = the same layout without the card frame. Compact = framed tiles with the icon beside the text, 3 per row (e.g. a list of security features).",
      type: "string",
      group: "options",
      options: {
        layout: "radio",
        list: [
          { title: "Card", value: "card" },
          { title: "Plain", value: "plain" },
          { title: "Compact", value: "compact" },
        ],
      },
      initialValue: "card",
    }),
    defineField({
      name: "linkStyle",
      title: "Link style",
      description:
        "Corner arrow = the whole card is the link, with an arrow top-right. Label = the link's label with an arrow under the copy (a down arrow for links to a section on the same page, e.g. “See how ↓”).",
      type: "string",
      group: "options",
      options: {
        layout: "radio",
        list: [
          { title: "Corner arrow", value: "arrow" },
          { title: "Label", value: "label" },
        ],
      },
      initialValue: "arrow",
    }),
    defineField({
      name: "cards",
      title: "Cards",
      description:
        "Card and Plain styles use a 4-column grid (a wide card spans 2 columns, a regular card 1); Compact uses 3 columns. Two wide cards then four regular cards fill two rows.",
      type: "array",
      group: "items",
      of: [
        defineArrayMember({
          type: "object",
          name: "card",
          fieldsets: [{ name: "stat", title: "Stat", options: { columns: 2 } }],
          fields: [
            defineField({
              name: "size",
              title: "Size",
              type: "string",
              options: {
                layout: "radio",
                direction: "horizontal",
                list: [
                  { title: "Regular (1 column)", value: "regular" },
                  { title: "Wide (2 columns)", value: "wide" },
                ],
              },
              initialValue: "regular",
            }),
            featureIcon,
            defineField({
              name: "statLabel",
              title: "Stat label",
              description:
                "Optional small label before the stat, e.g. “Win rate”. Not shown in Compact style.",
              type: "string",
              fieldset: "stat",
            }),
            defineField({
              name: "statValue",
              title: "Stat value",
              description:
                "Optional highlighted figure, e.g. “+43%”. Not shown in Compact style.",
              type: "string",
              fieldset: "stat",
            }),
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (Rule) => Rule.required().error("Each card needs a title."),
            }),
            defineField({
              name: "description",
              title: "Description",
              description: "One short sentence under the title.",
              type: "text",
              rows: 2,
              validation: (Rule) =>
                Rule.max(120).warning("Keep it to one short sentence."),
            }),
            defineField({
              name: "link",
              title: "Link",
              description:
                "Optional. Makes the whole card clickable and shows an arrow in the corner.",
              type: "link",
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "description", size: "size" },
            prepare: ({ title, subtitle, size }) => ({
              title: title || "Card",
              subtitle: [size === "wide" ? "Wide" : "Regular", subtitle]
                .filter(Boolean)
                .join(" · "),
            }),
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1).error("Add at least one card."),
    }),
    defineField({
      name: "ctas",
      title: "Call-to-actions",
      description:
        "Optional row of links under the grid, e.g. “Download security overview”, “Request a DPA”.",
      type: "array",
      of: [{ type: "cta" }],
      group: "links",
      validation: (Rule) =>
        Rule.max(4).warning("More than 4 links wrap onto a second line."),
    }),
  ],
  preview: {
    select: { content: "content", cards: "cards" },
    prepare: ({ content, cards }) => ({
      title: getPlainText(content) || "Bento grid",
      subtitle: cards?.length ? formatCount(cards, "card") : "Bento grid",
    }),
  },
});
