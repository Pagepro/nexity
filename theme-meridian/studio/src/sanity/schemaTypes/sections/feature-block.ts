import { TfiLayoutMediaCenter } from "react-icons/tfi";
import { defineField, defineType } from "sanity";

import { getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "feature-block",
  title: "Feature block",
  icon: TfiLayoutMediaCenter,
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
      name: "content",
      type: "simpleRichText",
      group: "content",
    }),
    defineField({
      name: "ctas",
      title: "Call-to-actions",
      type: "array",
      of: [{ type: "cta" }],
      group: "content",
    }),
    defineField({
      name: "images",
      title: "Images",
      description:
        "Recommended size depends on the chosen layout below: Single → 16:9, 1600×900px · Two-column grid → 4:3, 1200×900px · Hero with overlap → first image 2:1, 2000×1000px, the rest 4:3, 1200×900px.",
      type: "array",
      of: [{ type: "img" }],
      validation: (Rule) => Rule.max(3),
      group: "content",
    }),
    defineField({
      name: "imageLayout",
      title: "Image layout",
      type: "string",
      description: "How to arrange the images below the text",
      options: {
        list: [
          { title: "Hero with overlap", value: "hero-overlap" },
          { title: "Two-column grid", value: "grid" },
          { title: "Single image", value: "single" },
        ],
        layout: "radio",
      },
      hidden: ({ parent }) => !parent?.images?.length,
      group: "content",
    }),
  ],
  preview: {
    select: {
      content: "content",
    },
    prepare: ({ content }) => ({
      title: getPlainText(content),
      subtitle: "Feature block",
    }),
  },
});
