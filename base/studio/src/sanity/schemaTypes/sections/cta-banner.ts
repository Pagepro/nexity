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
        "Heading and supporting copy shown on the left of the banner. Use the heading-2 block style for the heading.",
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
  initialValue: {
    content: [
      {
        _key: "block_1",
        _type: "block",
        style: "heading-2",
        children: [
          {
            _key: "block_1_span_1",
            _type: "span",
            text: "Your pipeline shouldn't feel like a desert",
          },
        ],
      },
      {
        _key: "block_2",
        _type: "block",
        style: "body-2",
        children: [
          {
            _key: "block_2_span_1",
            _type: "span",
            text: "Connect your CRM and get your first win/loss report in under 24 hours.",
          },
        ],
      },
    ],
    ctas: [
      {
        _key: "cta_1",
        _type: "cta",
        link: {
          label: "Start free trial",
          _type: "link",
          type: "external",
          external: "https://www.google.com",
        },
        variant: "primary",
      },
      {
        _key: "cta_2",
        _type: "cta",
        link: {
          label: "Book free demo",
          _type: "link",
          type: "external",
          external: "https://www.google.com",
        },
        variant: "ghost",
      },
    ],
  },
});
