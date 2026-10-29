import { VscQuote } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import { getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "testimonial",
  title: "Testimonial",
  icon: VscQuote,
  type: "document",
  fields: [
    defineField({
      name: "author",
      title: "Author",
      description: "Full name of the person quoted, e.g. “Sarah Mitchell”.",
      type: "string",
      validation: (Rule) => Rule.required().error("A testimonial needs an author name."),
    }),
    defineField({
      name: "role",
      title: "Role",
      description: "Job title of the author, e.g. “VP of Sales”.",
      type: "string",
    }),
    defineField({
      name: "company",
      title: "Company",
      description: "Company the author works at, e.g. “Nanodea Inc.”.",
      type: "string",
    }),
    defineField({
      name: "quote",
      title: "Quote",
      description:
        "The testimonial text. Use the body-2 block style; apply the medium decorator to emphasise key phrases.",
      type: "simpleRichText",
      validation: (Rule) => Rule.required().error("A testimonial needs quote text."),
    }),
    defineField({
      name: "avatar",
      title: "Avatar",
      description:
        "Square headshot of the author. Aspect ratio 1:1, recommended 160×160px.",
      type: "img",
    }),
  ],
  preview: {
    select: {
      author: "author",
      role: "role",
      company: "company",
      quote: "quote",
      media: "avatar.image",
    },
    prepare: ({ author, role, company, quote, media }) => ({
      title: author || getPlainText(quote) || "Testimonial",
      subtitle: [role, company].filter(Boolean).join(", ") || "Testimonial",
      media,
    }),
  },
});
