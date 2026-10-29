import { VscFolderOpened } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import { formatCount } from "@/sanity/lib/utils";
import { requiredField } from "@/sanity/lib/validation-utils";

export default defineType({
  name: "headerLink.list",
  title: "Link list",
  icon: VscFolderOpened,
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Category title for the items in the list",
      validation: requiredField,
    }),
    defineField({
      name: "items",
      type: "array",
      of: [{ type: "link" }, { type: "link.list" }],
      validation: (Rule) => Rule.min(1).error("At least one item is required"),
    }),
    defineField({
      name: "visibleInMainMenu",
      type: "boolean",
      initialValue: true,
      description: "If false, the link will not be visible in the main menu",
    }),
  ],
  preview: {
    select: {
      title: "title",
      items: "items",
      visibleInMainMenu: "visibleInMainMenu",
    },
    prepare: ({ title, items, visibleInMainMenu }) => ({
      title: `${visibleInMainMenu ? "Main menu | " : ""}${title || "Link list title"}`,
      subtitle: formatCount(items, "link"),
    }),
  },
});
