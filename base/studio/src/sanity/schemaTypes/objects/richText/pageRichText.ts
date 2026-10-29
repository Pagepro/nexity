import { defineArrayMember, defineField } from "sanity";

import { COMMON_DECORATORS } from "./decorators";
import { HEADING_STYLES, PARAGRAPH_STYLES } from "./styles";

export default defineField({
  title: "Page Text",
  name: "pageRichText",
  description: "Text content for text-heavy pages, uses standard font styling with lists",
  type: "array",
  of: [
    {
      type: "block",
      name: "block",
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: COMMON_DECORATORS,
        annotations: [
          {
            name: "link",
            type: "simpleLink",
            title: "Link",
          },
        ],
      },
      styles: [...HEADING_STYLES, ...PARAGRAPH_STYLES],
    },
    defineArrayMember({ type: "img" }),
    defineArrayMember({ type: "pullquote" }),
    defineArrayMember({ type: "callout" }),
    defineArrayMember({ type: "code" }),
    defineArrayMember({ type: "table" }),
    defineArrayMember({ type: "videoEmbed" }),
    defineArrayMember({ type: "checklist" }),
  ],
});
