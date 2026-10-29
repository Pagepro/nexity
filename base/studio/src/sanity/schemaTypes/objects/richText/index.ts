import { VscColorMode } from "react-icons/vsc";
import { defineArrayMember, defineField } from "sanity";

import { ALIGNMENT_DECORATORS, COMMON_DECORATORS } from "./decorators";
import { ALT_HEADING_STYLES, ALT_PARAGRAPH_STYLES } from "./styles";

export default defineField({
  title: "Text",
  name: "richText",
  description: "Rich Text content that uses content font styling",
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
        decorators: [...COMMON_DECORATORS, ...ALIGNMENT_DECORATORS],
        annotations: [
          {
            name: "link",
            type: "simpleLink",
            title: "Link",
          },
          {
            type: "simplerColor",
            title: "Color",
            icon: VscColorMode,
          },
        ],
      },
      styles: [...ALT_HEADING_STYLES, ...ALT_PARAGRAPH_STYLES],
    },
    defineArrayMember({
      title: "Image",
      type: "img",
    }),
  ],
});
