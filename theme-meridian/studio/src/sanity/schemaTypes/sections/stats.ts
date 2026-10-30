import { BarChartIcon } from "@sanity/icons/BarChart";
import { defineArrayMember, defineField, defineType } from "sanity";

import { formatCount, getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "stats",
  title: "Stats",
  icon: BarChartIcon,
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
      name: "layout",
      title: "Layout",
      description:
        "Grid = heading on the left, stats in a 2×2 grid. Band = no heading, all stats in one divided row.",
      type: "string",
      group: "options",
      options: {
        layout: "radio",
        list: [
          { title: "Grid", value: "grid" },
          { title: "Band", value: "band" },
        ],
      },
      initialValue: "grid",
    }),
    defineField({
      name: "textAlign",
      title: "Text alignment",
      description: "Band layout only: left-aligned or centred stats.",
      type: "string",
      group: "options",
      options: {
        layout: "radio",
        direction: "horizontal",
        list: [
          { title: "Left", value: "left" },
          { title: "Center", value: "center" },
        ],
      },
      initialValue: "left",
      hidden: ({ parent }) => parent?.layout !== "band",
    }),
    defineField({
      name: "content",
      title: "Section title",
      description:
        "Heading and supporting copy shown in the left column (Grid layout only). Use the “Section Heading L” style for the heading.",
      type: "simpleRichText",
      group: "content",
      hidden: ({ parent }) => parent?.layout === "band",
    }),
    defineField({
      name: "stats",
      title: "Stats",
      description:
        "Grid layout: a 2-column grid beside the title (1 column on mobile). Band layout: one divided row of up to 4 (2×2 on mobile).",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "object",
          name: "stat",
          fields: [
            defineField({
              name: "value",
              title: "Value",
              description: "The metric itself, e.g. “43%”, “2.4×”, “11 days”.",
              type: "string",
              validation: (Rule) => Rule.required().error("Each stat needs a value."),
            }),
            defineField({
              name: "label",
              title: "Label",
              description: "Short description of what the value measures.",
              type: "string",
              validation: (Rule) => Rule.required().error("Each stat needs a label."),
            }),
          ],
          preview: {
            select: { title: "value", subtitle: "label" },
            prepare: ({ title, subtitle }) => ({
              title: title || "Stat",
              subtitle,
            }),
          },
        }),
      ],
      validation: (Rule) =>
        Rule.max(4).warning("Both layouts are designed for up to 4 stats."),
    }),
  ],
  preview: {
    select: { content: "content", stats: "stats" },
    prepare: ({ content, stats }) => ({
      title: getPlainText(content) || "Stats",
      subtitle: stats?.length ? formatCount(stats, "stat") : "No stats yet",
    }),
  },
});
