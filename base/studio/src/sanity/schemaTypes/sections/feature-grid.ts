import { ThLargeIcon } from "@sanity/icons/ThLarge";
import { defineArrayMember, defineField, defineType } from "sanity";

import { formatCount, getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "feature-grid",
  title: "Feature grid",
  icon: ThLargeIcon,
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
      description: "Small uppercase label above the heading (e.g. “Features”).",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "content",
      title: "Section title",
      description:
        "Centered heading shown above the cards. Use the heading-2 block style.",
      type: "simpleRichText",
      group: "content",
    }),
    defineField({
      name: "cards",
      title: "Cards",
      description:
        "Renders as a 3-column grid on desktop, stacking to 1 column on mobile. Add a card written by hand, or pick a Case study — its title, category, date and image are pulled in and the card links to it.",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "object",
          name: "card",
          title: "Card",
          fields: [
            defineField({
              name: "eyebrow",
              title: "Eyebrow",
              description:
                "Short uppercase label preceded by an accent marker (e.g. “Win/loss intelligence”).",
              type: "string",
              validation: (Rule) =>
                Rule.required().error("Each card needs an eyebrow label."),
            }),
            defineField({
              name: "title",
              title: "Headline",
              description: "The card's main statement — one short sentence.",
              type: "text",
              rows: 2,
              validation: (Rule) => Rule.required().error("Each card needs a headline."),
            }),
            defineField({
              name: "image",
              title: "Image",
              description:
                "Product screenshot shown below the text. Aspect ratio 4:3, recommended 800×600px (landscape).",
              type: "img",
            }),
            defineField({
              name: "link",
              title: "Link",
              description: "Optional. Makes the whole card clickable.",
              type: "link",
            }),
          ],
          preview: {
            select: { title: "title", eyebrow: "eyebrow", media: "image.image" },
            prepare: ({ title, eyebrow, media }) => ({
              title: title || "Feature card",
              subtitle: eyebrow,
              media,
            }),
          },
        }),
        defineArrayMember({
          type: "reference",
          title: "Case study",
          to: [{ type: "case-study" }],
        }),
      ],
      validation: (Rule) =>
        Rule.max(3).warning("The layout is designed for up to 3 cards per row."),
    }),
  ],
  preview: {
    select: { content: "content", cards: "cards", media: "cards.0.image.image" },
    prepare: ({ content, cards, media }) => ({
      title: getPlainText(content) || "Feature grid",
      subtitle: cards?.length ? formatCount(cards, "card") : "No cards yet",
      media,
    }),
  },
});
