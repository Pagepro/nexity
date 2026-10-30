import { SplitVerticalIcon } from "@sanity/icons/SplitVertical";
import { defineArrayMember, defineField, defineType } from "sanity";

import { formatCount, getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "split-sections",
  title: "Split sections",
  icon: SplitVerticalIcon,
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
      name: "rows",
      title: "Rows",
      description:
        "Each row is a two-column block (text + image), or full-width text when it has no image. Rows alternate the image side automatically — first row image right, second image left, and so on.",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "object",
          name: "row",
          fieldsets: [
            { name: "label", title: "Label", options: { columns: 2 } },
            {
              name: "advanced",
              title: "Advanced",
              options: { collapsible: true, collapsed: true },
            },
          ],
          fields: [
            defineField({
              name: "eyebrow",
              title: "Eyebrow",
              description:
                "Short uppercase label above the heading, e.g. “Win/Loss analysis”.",
              type: "string",
              fieldset: "label",
            }),
            defineField({
              name: "badge",
              title: "Outcome badge",
              description:
                "Optional small pill next to the eyebrow highlighting the result, e.g. “31% shorter cycles”.",
              type: "string",
              fieldset: "label",
            }),
            defineField({
              name: "content",
              title: "Content",
              description:
                "Heading and supporting copy. Use the “Section Heading L” style for the heading and “Text Medium” for the description.",
              type: "simpleRichText",
              validation: (Rule) => Rule.required().error("Each row needs heading copy."),
            }),
            defineField({
              name: "comparison",
              title: "Before / after",
              description:
                "Optional pair of cards contrasting the problem and the outcome. Best on a row without an image, where it gets the full width.",
              type: "object",
              options: { collapsible: true, collapsed: true },
              fields: [
                defineField({
                  name: "beforeTitle",
                  title: "Before title",
                  type: "string",
                  initialValue: "Before",
                }),
                defineField({
                  name: "beforeItems",
                  title: "Before items",
                  type: "array",
                  of: [{ type: "string" }],
                  validation: (Rule) =>
                    Rule.max(5).warning(
                      "Three to five items keep the two cards balanced.",
                    ),
                }),
                defineField({
                  name: "afterTitle",
                  title: "After title",
                  type: "string",
                  initialValue: "After",
                }),
                defineField({
                  name: "afterItems",
                  title: "After items",
                  type: "array",
                  of: [{ type: "string" }],
                  validation: (Rule) =>
                    Rule.max(5).warning(
                      "Three to five items keep the two cards balanced.",
                    ),
                }),
              ],
            }),
            defineField({
              name: "bulletsTitle",
              title: "Bullet points title",
              description:
                "Optional small uppercase label above the bullets, e.g. “How it works”.",
              type: "string",
            }),
            defineField({
              name: "bullets",
              title: "Bullet points",
              description: "Optional checklist under the copy — one short phrase each.",
              type: "array",
              of: [{ type: "string" }],
              validation: (Rule) =>
                Rule.max(5).warning("Three to five bullets read best."),
            }),
            defineField({
              name: "insight",
              title: "Insight callout",
              description:
                "Optional bordered callout under the bullets, e.g. a label “Example insight” and one sentence.",
              type: "object",
              options: { collapsible: true, collapsed: true },
              fields: [
                defineField({
                  name: "label",
                  title: "Label",
                  type: "string",
                  initialValue: "Example insight",
                }),
                defineField({
                  name: "text",
                  title: "Text",
                  type: "text",
                  rows: 2,
                  validation: (Rule) =>
                    Rule.max(160).warning("Keep the insight to one sentence."),
                }),
              ],
            }),
            defineField({
              name: "ctas",
              title: "Call-to-actions",
              description: "Optional button shown below the copy.",
              type: "array",
              of: [{ type: "cta" }],
              validation: (Rule) =>
                Rule.max(2).warning(
                  "The layout is designed for a single button per row.",
                ),
            }),
            defineField({
              name: "proof",
              title: "Proof point",
              description:
                "Optional one-line result shown with a check icon, e.g. “Finmo cut its average cycle from 47 to 32 days.”",
              type: "string",
              validation: (Rule) =>
                Rule.max(140).warning("Keep the proof point to one line."),
            }),
            defineField({
              name: "image",
              title: "Image",
              description:
                "Shown in a tinted rounded frame beside the copy. Leave empty for a full-width text row (e.g. with a before/after comparison). Aspect ratio 4:3, recommended 1360×1020px (landscape).",
              type: "img",
            }),
            defineField({
              name: "anchor",
              title: "Anchor",
              description:
                "Optional in-page anchor id (lowercase-with-dashes), so a link to “/page#anchor” scrolls to this row, e.g. “shorten-the-sales-cycle”.",
              type: "string",
              fieldset: "advanced",
              validation: (Rule) =>
                Rule.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { name: "anchor id" }).error(
                  "Use lowercase letters, numbers and dashes only, e.g. “shorten-the-sales-cycle”.",
                ),
            }),
          ],
          preview: {
            select: { eyebrow: "eyebrow", content: "content", media: "image.image" },
            prepare: ({ eyebrow, content, media }) => ({
              title: getPlainText(content) || "Row",
              subtitle: eyebrow || "Split row",
              media,
            }),
          },
        }),
      ],
      validation: (Rule) =>
        Rule.min(1).max(6).warning("Up to 6 rows render comfortably."),
    }),
  ],
  preview: {
    select: { rows: "rows" },
    prepare: ({ rows }) => ({
      title: "Split sections",
      subtitle: rows?.length ? formatCount(rows, "row") : "No rows yet",
    }),
  },
});
