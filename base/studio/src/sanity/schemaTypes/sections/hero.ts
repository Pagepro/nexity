import { TfiLayoutCtaCenter } from "react-icons/tfi";
import { defineField, defineType } from "sanity";

import { getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "hero",
  title: "Hero",
  icon: TfiLayoutCtaCenter,
  type: "object",
  groups: [
    { name: "content", default: true },
    { name: "image", title: "Hero image" },
    { name: "options" },
  ],
  fieldsets: [{ name: "alignment", options: { columns: 2 } }],
  fields: [
    defineField({
      name: "options",
      title: "Section options",
      type: "section-options",
      group: "options",
    }),
    defineField({
      name: "layout",
      title: "Layout",
      description:
        "Background hero = full-bleed image with overlaid light text. Product hero = centered dark text and CTAs above a framed product screenshot, over a soft background image.",
      type: "string",
      group: "options",
      options: {
        layout: "radio",
        list: [
          { title: "Background hero", value: "background-hero" },
          { title: "Product hero", value: "product-hero" },
        ],
      },
    }),
    defineField({
      name: "pretitle",
      type: "string",
      group: "content",
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
      name: "logosTitle",
      title: "Logos label",
      description:
        "Small uppercase label above the logo row, e.g. “Trusted by revenue teams at” (Product hero layout only).",
      type: "string",
      group: "content",
      hidden: ({ parent }) => parent?.layout !== "product-hero",
    }),
    defineField({
      name: "image",
      title: "Background image",
      description:
        "Full-bleed background image that bleeds to the section edges. In the Background hero it is the main hero image (a dark overlay keeps the light text legible); in the Product hero it is the soft sky/scenery backdrop behind the centred text. Aspect ratio 16:9, recommended 2560×1440px (landscape). The focal point is centred when cropped.",
      type: "img",
      group: "image",
    }),
    defineField({
      name: "productImage",
      title: "Product screenshot",
      description:
        "Foreground product screenshot shown in a bordered, rounded frame below the text (Product hero layout only). Aspect ratio 16:9, recommended 1920×1080px (landscape).",
      type: "img",
      group: "image",
      hidden: ({ parent }) => parent?.layout !== "product-hero",
    }),
    defineField({
      name: "logos",
      title: "Logos",
      description:
        "Optional static row of customer logos between the buttons and the product screenshot (Product hero layout only). Rendered greyscale at 28px tall. Transparent background. Aspect ratio 5:1, recommended 120×24px (landscape, SVG preferred).",
      type: "array",
      of: [{ type: "img" }],
      group: "image",
      hidden: ({ parent }) => parent?.layout !== "product-hero",
      validation: (Rule) =>
        Rule.max(6).warning("More than 6 logos wrap onto a second line."),
    }),
    defineField({
      name: "bottomImage",
      title: "Bottom overlay image",
      description:
        "Optional decorative image pinned to the bottom edge of the hero, spanning the full width and overlapping the hero/background image above it. Purely decorative — it never intercepts clicks. On desktop the full image is shown uncropped at full width; on mobile it is centred and capped at ~240px tall. Use a long, wide graphic (e.g. a horizon, skyline or gradient strip). Aspect ratio ~16:3, recommended 2560×480px (landscape).",
      type: "img",
      group: "image",
    }),
    defineField({
      name: "textAlign",
      title: "Text alignment",
      type: "string",
      options: {
        list: [
          { title: "Left", value: "left" },
          { title: "Center", value: "center" },
          { title: "Right", value: "right" },
          { title: "Justify", value: "justify" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "center",
      group: "options",
      fieldset: "alignment",
    }),
    defineField({
      name: "alignItems",
      title: "Vertical alignment",
      type: "string",
      options: {
        list: [
          { title: "Top", value: "start" },
          { title: "Center", value: "center" },
          { title: "Bottom", value: "end" },
          { title: "Stretch", value: "stretch" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "center",
      group: "options",
      fieldset: "alignment",
    }),
  ],
  preview: {
    select: {
      content: "content",
      media: "image",
    },
    prepare: ({ content, media }) => ({
      title: getPlainText(content),
      subtitle: "Hero",
      media: media?.image,
    }),
  },
  initialValue: {
    layout: "product-hero",
    pretitle: "Acme",
    content: [
      {
        _key: "block_1",
        _type: "block",
        style: "section-heading-xl",
        children: [
          {
            _key: "block_1_span_1",
            _type: "span",
            text: "Build Something Amazing",
          },
        ],
      },
      {
        _key: "block_2",
        _type: "block",
        style: "normal",
        children: [
          {
            _key: "block_2_span_1",
            _type: "span",
            text: "Create exceptional digital experiences with our powerful platform. Everything you need to bring your vision to life.",
          },
        ],
      },
    ],
    ctas: [
      {
        _key: "cta_1",
        _type: "cta",
        link: {
          label: "Get Started",
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
          label: "Learn More",
          _type: "link",
          type: "external",
          external: "https://www.google.com",
        },
        variant: "primary-outline",
      },
    ],
    textAlign: "center",
    alignItems: "center",
  },
});
