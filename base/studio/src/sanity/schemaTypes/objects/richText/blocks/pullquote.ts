import { VscQuote } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "pullquote",
  title: "Pull quote",
  icon: VscQuote,
  type: "object",
  description:
    "An inline quote with an optional attribution (avatar + name + role). For the large standalone testimonial use the Quote section instead.",
  fields: [
    defineField({
      name: "quote",
      title: "Quote",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required().error("A pull quote needs quote text."),
    }),
    defineField({
      name: "author",
      title: "Author",
      description: "Full name of the person quoted, e.g. “Sarah Mitchell”.",
      type: "string",
    }),
    defineField({
      name: "role",
      title: "Role",
      description: "Job title / company of the author, e.g. “VP of Sales, Nanodea Inc.”.",
      type: "string",
    }),
    defineField({
      name: "avatar",
      title: "Avatar",
      description:
        "Square headshot of the author. Aspect ratio 1:1, recommended 80×80px.",
      type: "img",
    }),
  ],
  preview: {
    select: { quote: "quote", author: "author", media: "avatar.image" },
    prepare: ({ quote, author, media }) => ({
      title: quote || "Pull quote",
      subtitle: author || "Pull quote",
      media,
    }),
  },
});
