import { VscMegaphone } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import { getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "cta-banner",
  title: "CTA banner",
  icon: VscMegaphone,
  type: "object",
  groups: [
    { name: "content", default: true },
    { name: "image", title: "Images" },
    { name: "options" },
  ],
  fields: [
    defineField({
      name: "options",
      title: "Section options",
      type: "section-options",
      group: "options",
    }),
    defineField({
      name: "content",
      title: "Content",
      description:
        "Heading and supporting copy shown on the left of the banner. Use the “Section Heading L” style for the heading.",
      type: "simpleRichText",
      group: "content",
    }),
    defineField({
      name: "ctas",
      title: "Call-to-actions",
      type: "array",
      of: [{ type: "cta" }],
      group: "content",
      validation: (Rule) =>
        Rule.max(2).warning("The banner layout is designed for up to 2 buttons."),
    }),
    defineField({
      name: "backgroundImage",
      title: "Background image",
      description:
        "Wide scenery/gradient image that fills the rounded banner card behind the text. Aspect ratio 2.8:1, recommended 2464×880px (landscape). The focal point is centred when cropped.",
      type: "img",
      group: "image",
    }),
    defineField({
      name: "image",
      title: "Product screenshot",
      description:
        "Foreground product screenshot shown on the right, bleeding past the card edge. Aspect ratio 16:9, recommended 1920×1080px (landscape).",
      type: "img",
      group: "image",
    }),
  ],
  preview: {
    select: {
      content: "content",
      media: "backgroundImage",
    },
    prepare: ({ content, media }) => ({
      title: getPlainText(content) || "CTA banner",
      subtitle: "CTA banner",
      media: media?.image,
    }),
  },
});
