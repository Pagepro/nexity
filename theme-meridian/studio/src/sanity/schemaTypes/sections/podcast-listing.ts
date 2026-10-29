import { TfiLayoutListThumb } from "react-icons/tfi";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "podcast-listing",
  title: "Podcast Listing",
  type: "object",
  icon: TfiLayoutListThumb,
  groups: [{ name: "content", default: true }, { name: "options" }],
  fields: [
    defineField({
      name: "options",
      title: "Section options",
      type: "section-options",
      group: "options",
    }),
    defineField({
      name: "perPage",
      title: "Episodes per page",
      description: "Number of rows per page in the archive. Default 8.",
      type: "number",
      initialValue: 8,
      validation: (Rule) => Rule.min(1).max(24).integer(),
      group: "content",
    }),
  ],
  preview: {
    prepare: () => ({
      title: "Podcast Listing",
      subtitle: "Podcast Listing",
    }),
  },
});
