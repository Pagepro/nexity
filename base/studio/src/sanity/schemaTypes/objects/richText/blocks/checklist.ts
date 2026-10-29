import { VscChecklist } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "checklist",
  title: "Checklist",
  icon: VscChecklist,
  type: "object",
  description:
    "A list of do / don’t items. Each item shows a check or cross icon, a title, and an optional description.",
  fields: [
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      validation: (Rule) =>
        Rule.required().min(1).error("Add at least one checklist item."),
      of: [
        defineArrayMember({
          type: "object",
          name: "item",
          fields: [
            defineField({
              name: "tone",
              title: "Tone",
              type: "string",
              options: {
                layout: "radio",
                list: [
                  { title: "Do (check)", value: "do" },
                  { title: "Don’t (cross)", value: "dont" },
                ],
              },
              initialValue: "do",
            }),
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (Rule) =>
                Rule.required().error("A checklist item needs a title."),
            }),
            defineField({
              name: "description",
              title: "Description",
              description: "Optional supporting text shown under the title.",
              type: "text",
              rows: 2,
            }),
          ],
          preview: {
            select: { title: "title", tone: "tone", description: "description" },
            prepare: ({ title, tone, description }) => ({
              title: `${tone === "dont" ? "✗" : "✓"} ${title}`,
              subtitle: description,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { items: "items" },
    prepare: ({ items }) => ({
      title: "Checklist",
      subtitle: items?.length
        ? `${items.length} item${items.length === 1 ? "" : "s"}`
        : "Empty",
    }),
  },
});
