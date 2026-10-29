import { VscLink } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import resolveSlug from "@/sanity/lib/resolveSlug";

import { linkBaseFields, linkBasePreviewSelect } from "../partials/linkBaseSchema";

export default defineType({
  name: "link",
  title: "Link",
  icon: VscLink,
  type: "object",
  fields: [
    defineField({
      name: "label",
      type: "string",
    }),
    ...linkBaseFields,
  ],
  preview: {
    select: {
      label: "label",
      ...linkBasePreviewSelect,
    },
    prepare: ({ label, title, ...rest }) => ({
      title: label || title,
      subtitle: resolveSlug(rest),
    }),
  },
});
