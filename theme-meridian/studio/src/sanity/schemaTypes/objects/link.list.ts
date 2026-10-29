import { VscFolderOpened } from "react-icons/vsc";
import { defineField, defineType, StringRule } from "sanity";

import { formatCount } from "@/sanity/lib/utils";
import { makeVisibleFieldValidator, requiredField } from "@/sanity/lib/validation-utils";

export default defineType({
  name: "link.list",
  title: "Link list",
  icon: VscFolderOpened,
  type: "object",
  fields: [
    defineField({
      name: "withTitle",
      type: "boolean",
      initialValue: true,
      description: "If false, the link list will not have a title",
    }),
    defineField({
      name: "title",
      type: "string",
      hidden: ({ parent }) => !parent?.withTitle,
      validation: makeVisibleFieldValidator<StringRule>(requiredField),
    }),

    defineField({
      name: "link",
      type: "link",
      hidden: ({ parent }) => parent?.withTitle,
    }),
    defineField({
      name: "links",
      type: "array",
      of: [{ type: "link" }, { type: "link.list" }],
    }),
  ],
  preview: {
    select: {
      title: "title",
      link: "link",
      links: "links",
    },
    prepare: ({ title, link, links }) => ({
      title: title || link?.label || link?.internal?.title,
      subtitle: formatCount(links, "link"),
    }),
  },
});
