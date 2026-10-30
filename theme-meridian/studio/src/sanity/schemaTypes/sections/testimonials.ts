import { VscCommentDiscussion } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import { formatCount, getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "testimonials",
  title: "Testimonials",
  icon: VscCommentDiscussion,
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
      name: "layout",
      title: "Layout",
      description:
        "Carousel = heading above a row of testimonial cards. Featured = the first testimonial alone, as a large centred quote (heading hidden).",
      type: "string",
      group: "options",
      options: {
        layout: "radio",
        list: [
          { title: "Carousel", value: "carousel" },
          { title: "Featured", value: "featured" },
        ],
      },
      initialValue: "carousel",
    }),
    defineField({
      name: "pretitle",
      title: "Tagline",
      description: "Short uppercase label above the heading, e.g. “Reviews”.",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "content",
      title: "Content",
      description:
        "Section heading and optional supporting copy. Use the “Section Heading L” style for the heading.",
      type: "simpleRichText",
      group: "content",
    }),
    defineField({
      name: "mark",
      title: "Mark",
      description:
        "Optional small brand mark above the featured quote (Featured layout only). Aspect ratio 1:1, recommended 48×48px (square, SVG preferred).",
      type: "img",
      group: "content",
      hidden: ({ parent }) => parent?.layout !== "featured",
    }),
    defineField({
      name: "testimonials",
      title: "Testimonials",
      description:
        "Pick the testimonials to show, in order. Each is a Testimonial document — edits there propagate everywhere it is referenced on the next publish.",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "testimonial" }],
        }),
      ],
      validation: (Rule) =>
        Rule.required().min(1).error("Pick at least one testimonial to display."),
    }),
  ],
  preview: {
    select: { content: "content", testimonials: "testimonials" },
    prepare: ({ content, testimonials }) => ({
      title: getPlainText(content) || "Testimonials",
      subtitle: testimonials?.length
        ? formatCount(testimonials, "testimonial")
        : "Testimonials",
    }),
  },
});
