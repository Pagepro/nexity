import { VscTextSize } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import { formatCount, getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "content",
  title: "Content section",
  icon: VscTextSize,
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
      type: "richText",
      group: "content",
    }),
  ],
  preview: {
    select: {
      content: "content",
    },
    prepare: ({ content }) => ({
      title: getPlainText(content) || formatCount(content, "block"),
      subtitle: "Content section (Rich Text)",
    }),
  },
});
