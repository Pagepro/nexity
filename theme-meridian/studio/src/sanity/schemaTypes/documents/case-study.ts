import { VscFile } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import {
  STRUCTURED_DATA_GROUP,
  schemaArticleTypeField,
  structuredDataFields,
} from "../partials/structuredDataFields";

export default defineType({
  name: "case-study",
  title: "Case study",
  icon: VscFile,
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "listing", title: "Listing & meta" },
    { name: "metadata", title: "Metadata" },
    STRUCTURED_DATA_GROUP,
  ],
  fields: [
    defineField({
      name: "publishedAt",
      title: "Published at",
      description: "Shown in the detail-page meta line (“Case study · {date}”).",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      group: "listing",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description:
        "Industry shown on listing cards and used by the case-studies listing filter. Values must stay in sync across three places: this schema list, web CaseStudiesListingSection/constants.ts CATEGORIES, and the /api/case-studies route-handler GROQ filter.",
      options: {
        list: [
          { title: "Fintech", value: "Fintech" },
          { title: "Healthcare", value: "Healthcare" },
          { title: "E-commerce", value: "E-commerce" },
          { title: "SaaS", value: "SaaS" },
          { title: "Manufacturing", value: "Manufacturing" },
          { title: "Logistics", value: "Logistics" },
          { title: "Other", value: "Other" },
        ],
      },
      group: "listing",
    }),
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      description:
        "Fallback label above the headline on cards. Cards show “Category · date” when a category or published date is set, so this only appears when both are empty. Defaults to “Case study”.",
      type: "string",
      group: "listing",
    }),
    defineField({
      name: "logo",
      title: "Client logo",
      description:
        "Client logo shown at the top of the detail page. Aspect ratio ~5:1, recommended 456×88px (landscape, transparent PNG).",
      type: "img",
      group: "listing",
    }),
    defineField({
      name: "image",
      title: "Cover image",
      description:
        "Card cover image. Aspect ratio 4:3, recommended 800×600px (landscape).",
      type: "img",
      validation: (Rule) => Rule.required().error("A case study needs a cover image."),
      group: "listing",
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      description:
        "Lead paragraph under the H1, also used as the SEO description and card subtitle.",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(200).warning("Keep excerpts concise"),
      group: "listing",
    }),
    defineField({
      name: "authors",
      title: "Author",
      description: "The case-study author — shown as a byline on the detail page.",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "author" }] })],
      validation: (Rule) => Rule.max(1).warning("Only the first author is shown."),
      group: "listing",
    }),
    defineField({
      name: "metrics",
      title: "Metrics",
      description: "Headline stats shown in the card below the lead paragraph.",
      type: "array",
      group: "listing",
      of: [
        defineArrayMember({
          type: "object",
          name: "metric",
          fields: [
            defineField({
              name: "value",
              title: "Value",
              description: "The number, e.g. “43%”, “2.4×”, “11 days”.",
              type: "string",
              validation: (Rule) => Rule.required().error("A metric needs a value."),
            }),
            defineField({
              name: "label",
              title: "Label",
              description:
                "What the number describes, e.g. “Average increase in win rate”.",
              type: "string",
              validation: (Rule) => Rule.required().error("A metric needs a label."),
            }),
          ],
          preview: {
            select: { value: "value", label: "label" },
            prepare: ({ value, label }) => ({ title: value, subtitle: label }),
          },
        }),
      ],
    }),
    defineField({
      name: "body",
      title: "Body",
      description: "The case-study article.",
      type: "pageRichText",
      group: "content",
    }),
    defineField({
      name: "quote",
      title: "Quote",
      description: "A single large testimonial shown beneath the article.",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "testimonial" }] })],
      validation: (Rule) => Rule.max(1).warning("Only the first testimonial is shown."),
      group: "content",
    }),
    defineField({
      name: "link",
      title: "External link override",
      description:
        "Optional — point the card to an off-site case study instead of the detail page. Leave empty to link to /case-studies/{slug}.",
      type: "link",
      group: "listing",
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
  ],
  preview: {
    select: { title: "metadata.title", eyebrow: "eyebrow", media: "image.image" },
    prepare: ({ title, eyebrow, media }) => ({
      title: title || "Case study",
      subtitle: eyebrow || "Case study",
      media,
    }),
  },
});
