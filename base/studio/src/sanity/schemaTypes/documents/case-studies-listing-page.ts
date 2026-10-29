import { VscFileSubmodule } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import sections from "../fragments/sections";
import {
  STRUCTURED_DATA_GROUP,
  structuredDataFields,
} from "../partials/structuredDataFields";

export default defineType({
  name: "case-studies-listing-page",
  title: "Case Studies Listing Page",
  type: "document",
  icon: VscFileSubmodule,
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
      name: "content",
      title: "Content",
      description: "Title and description displayed above the listing",
      type: "simpleRichText",
      group: "content",
    }),
    defineField({
      name: "featuredCaseStudy",
      title: "Featured case study",
      description:
        "Large highlighted card shown above the listing grid. Optional; pick one. Excluded from the grid to avoid duplication.",
      type: "array",
      of: [{ type: "reference", to: [{ type: "case-study" }] }],
      validation: (Rule) => Rule.max(1),
      group: "content",
    }),
    defineField({
      ...sections,
      group: "content",
    }),
    defineField({
      name: "metadata",
      type: "metadata",
      group: "metadata",
      initialValue: { slug: { _type: "slug", current: "case-studies" } },
    }),
    ...structuredDataFields,
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare: ({ title }) => ({
      title: title || "Case Studies Listing",
      subtitle: "/case-studies",
    }),
  },
});
