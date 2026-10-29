import { VscEdit } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import {
  STRUCTURED_DATA_GROUP,
  schemaArticleTypeField,
  structuredDataFields,
} from "../partials/structuredDataFields";

export default defineType({
  name: "post",
  title: "Post",
  type: "document",
  icon: VscEdit,
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "listing", title: "Listing" },
    { name: "metadata", title: "Metadata" },
    STRUCTURED_DATA_GROUP,
  ],
  fields: [
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
      group: "listing",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description:
        "Category shown on listing cards and used by the blog listing filter. Values must stay in sync across three places: this schema list, web BlogListingSection/constants.ts CATEGORIES, and the /api/blog/posts route-handler GROQ filter.",
      options: {
        list: [
          { title: "Win/loss", value: "Win/loss" },
          { title: "Research report", value: "Research report" },
          { title: "Content strategy", value: "Content strategy" },
          { title: "Product updates", value: "Product updates" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
      group: "listing",
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      description:
        "Optional thumbnail shown in the listing grid and hero on the detail page. Aspect ratio 16:10, recommended 1600×1000px (landscape).",
      type: "img",
      group: "listing",
    }),
    defineField({
      name: "authors",
      title: "Author",
      description: "The post author — shown as a byline on cards and the detail page.",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "author" }] })],
      validation: (Rule) => Rule.max(1).warning("Only the first author is shown."),
      group: "listing",
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      description: "Short summary shown on listing cards and used for SEO",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(200).warning("Keep excerpts concise"),
      group: "listing",
    }),
    defineField({
      name: "body",
      title: "Body",
      description: "Article content",
      type: "pageRichText",
      group: "content",
    }),
    defineField({
      name: "metadata",
      type: "metadata",
      group: "metadata",
    }),
    ...structuredDataFields,
    schemaArticleTypeField,
  ],
  orderings: [
    {
      title: "Published, newest first",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    {
      title: "Title A-Z",
      name: "titleAsc",
      by: [{ field: "metadata.title", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "metadata.title",
      subtitle: "category",
      media: "coverImage.image",
    },
    prepare: ({ title, subtitle, media }) => ({
      title: title || "Untitled post",
      subtitle,
      media,
    }),
  },
});
