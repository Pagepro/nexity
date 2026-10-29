import {
  VscHome,
  VscQuestion,
  VscEyeClosed,
  VscSearch,
  VscMortarBoard,
} from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import sections from "../fragments/sections";
import {
  STRUCTURED_DATA_GROUP,
  structuredDataFields,
} from "../partials/structuredDataFields";

export default defineType({
  name: "page",
  title: "Page",
  type: "document",
  groups: [
    { name: "content", default: true },
    { name: "metadata" },
    STRUCTURED_DATA_GROUP,
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      ...sections,
      group: "content",
    }),
    defineField({
      name: "metadata",
      type: "metadata",
      group: "metadata",
    }),
    ...structuredDataFields,
  ],
  preview: {
    select: {
      title: "title",
      slug: "metadata.slug.current",
      media: "metadata.image",
      noindex: "metadata.noIndex",
    },
    prepare: ({ title, slug, media, noindex }) => ({
      title,
      subtitle: slug && (slug === "/" ? "/" : `/${slug}`),
      media:
        media ||
        (slug === "/" && VscHome) ||
        (slug === "404" && VscQuestion) ||
        (slug === "search" && VscSearch) ||
        (slug.startsWith("docs") && VscMortarBoard) ||
        (noindex && VscEyeClosed),
    }),
  },
});
