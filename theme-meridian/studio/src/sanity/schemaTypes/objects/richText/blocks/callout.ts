import { VscMegaphone } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "callout",
  title: "Callout / CTA",
  icon: VscMegaphone,
  type: "object",
  description:
    "An inline promo banner inside the article — a heading, a call-to-action button, and an optional background image.",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "options", title: "Options" },
  ],
  fields: [
    defineField({
      name: "content",
      title: "Heading",
      description:
        "Short heading shown on the left, e.g. “See how Meridian can help your team”.",
      type: "simpleRichText",
      group: "content",
    }),
    defineField({
      name: "cta",
      title: "Call-to-action",
      type: "cta",
      group: "content",
    }),
    defineField({
      name: "backgroundImage",
      title: "Background image",
      description:
        "Optional decorative background behind the callout. Aspect ratio ~16:3, recommended 1568×288px (landscape).",
      type: "img",
      group: "options",
    }),
  ],
  preview: {
    select: { content: "content", media: "backgroundImage.image" },
    prepare: ({ content, media }) => ({
      title: content?.[0]?.children?.[0]?.text || "Callout",
      subtitle: "Callout / CTA",
      media,
    }),
  },
});
