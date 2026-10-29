import { VscPlug } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import { INTEGRATION_CATEGORIES } from "@/consts/integration-categories";

export default defineType({
  name: "integration",
  title: "Integration",
  icon: VscPlug,
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      description: "Product name, e.g. “Cumulo”.",
      type: "string",
      validation: (Rule) => Rule.required().error("An integration needs a name."),
    }),
    defineField({
      name: "category",
      title: "Category",
      description: "Drives the category tabs in the Integrations grid section.",
      type: "string",
      options: { list: [...INTEGRATION_CATEGORIES] },
      validation: (Rule) =>
        Rule.required().error("Pick a category so the integration shows under a tab."),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      description:
        "Optional square logo mark. When empty, the tile shows the name's initials. Aspect ratio 1:1, recommended 80×80px (square, SVG preferred).",
      type: "img",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "category", media: "logo.image" },
    prepare: ({ title, subtitle, media }) => ({
      title: title || "Integration",
      subtitle,
      media,
    }),
  },
});
