import { defineField, defineType } from "sanity";

// Hidden; exists only so TypeGen emits the reusable fragment types (README "How to Add New Types").
export default defineType({
  name: "internal.typeSource",
  type: "document",
  hidden: true,
  fields: [
    defineField({
      name: "image",
      type: "img",
    }),
    defineField({
      name: "link",
      type: "link",
    }),
    defineField({
      name: "metadata",
      type: "metadata",
    }),
    defineField({
      name: "cta",
      type: "cta",
    }),
  ],
});
