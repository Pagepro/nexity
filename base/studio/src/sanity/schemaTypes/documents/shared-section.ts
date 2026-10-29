import { VscSymbolField } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import { formatCount } from "@/sanity/lib/utils";

import { INNER_SECTIONS } from "../fragments/sections";

export default defineType({
  name: "shared-section",
  title: "Shared section",
  type: "document",
  icon: VscSymbolField,
  groups: [{ name: "content", default: true }],
  fields: [
    defineField({
      name: "title",
      type: "string",
      description:
        "Internal name shown in the picker and Studio sidebar. Not displayed on the frontend.",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "sections",
      title: "Sections",
      description:
        "One or more reusable sections. Edits here propagate to every page that references this shared section on the next publish.",
      type: "array",
      of: [...INNER_SECTIONS],
      group: "content",
      options: {
        insertMenu: {
          views: [
            {
              name: "grid",
              previewImageUrl: (schemaType: string) =>
                `/admin/thumbnails/${schemaType}.webp`,
            },
            { name: "list" },
          ],
        },
      },
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: "title",
      sections: "sections",
    },
    prepare: ({ title, sections }) => ({
      title: title ?? "Untitled shared section",
      subtitle: formatCount(sections ?? [], "section"),
    }),
  },
});
