import { VscSymbolField, VscSymbolVariable } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import { formatCount } from "@/sanity/lib/utils";

import sections from "../fragments/sections";

export default defineType({
  name: "global-section",
  title: "Global section",
  type: "document",
  icon: VscSymbolField,
  fields: [
    defineField({
      name: "path",
      type: "string",
      description:
        'URL path to add sections. Set to "*" for all pages. A trailing slash "/" excludes the parent path.',
      placeholder: "e.g. *, blog/, foo/bar/, etc.",
      validation: (Rule) => Rule.regex(/^(\*|[a-z0-9-_/]+\/?)$/),
    }),
    defineField({
      name: "excludePaths",
      type: "array",
      description:
        'URL paths to exclude sections from being added. A trailing slash "/" excludes the parent path.',
      of: [
        defineArrayMember({
          type: "string",
          placeholder: "e.g. blog/, foo/bar/, etc.",
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      ...sections,
      name: "before",
      description: "Sections to add before the page content",
    }),
    defineField({
      ...sections,
      name: "after",
      description: "Sections to add after the page content",
    }),
  ],
  preview: {
    select: {
      path: "path",
      before: "before",
      after: "after",
    },
    prepare: ({ path, before, after }) => ({
      title: formatCount([...(before ?? []), ...(after ?? [])], "section"),
      subtitle: path === "*" ? "* (All pages)" : path,
      media: path === "*" ? VscSymbolVariable : VscSymbolField,
    }),
  },
});
