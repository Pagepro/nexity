import { TfiText } from "react-icons/tfi";
import { defineField, defineType } from "sanity";

import { formatCount, getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "text-block",
  title: "Text block",
  icon: TfiText,
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
      name: "textAlign",
      title: "Text alignment",
      description:
        "Center = heading, copy and buttons centred, e.g. a closing call to action.",
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
  ],
  preview: {
    select: {
      content: "content",
    },
    prepare: ({ content }) => ({
      title: getPlainText(content) || formatCount(content, "block"),
      subtitle: "Text block",
    }),
  },
  initialValue: {
    content: [
      {
        _key: "block_1",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "block_1_span_1",
            _type: "span",
            text: "Your text content goes here.",
          },
        ],
      },
    ],
    ctas: [
      {
        _key: "cta_1",
        _type: "cta",
        link: {
          label: "Learn More",
          _type: "link",
          type: "external",
          external: "https://www.google.com",
        },
        variant: "primary",
      },
    ],
  },
});
