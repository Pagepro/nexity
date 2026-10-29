import { VscColorMode } from "react-icons/vsc";
import { defineField } from "sanity";

import { COMMON_DECORATORS } from "./decorators";
import { PARAGRAPH_STYLES, SECTION_HEADING_STYLES } from "./styles";

export default defineField({
  title: "Text",
  name: "simpleRichText",
  description: "Sections text content that uses design font styling",
  type: "array",
  of: [
    {
      type: "block",
      name: "block",
      lists: [],
      marks: {
        decorators: COMMON_DECORATORS,
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
      // `heading-1..6` is omitted on purpose: sections use the Section heading scale; `pageRichText` keeps H1–H6.
      styles: [...SECTION_HEADING_STYLES, ...PARAGRAPH_STYLES],
    },
  ],
});
