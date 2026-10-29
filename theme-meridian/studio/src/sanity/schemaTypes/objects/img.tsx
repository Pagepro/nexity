import { VscFileMedia } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import { formatCount } from "@/sanity/lib/utils";
import {
  MediaQueryInput,
  type MediaQuerySuggestion,
} from "@/sanity/ui/media-query-input";

const MEDIA_QUERY_SUGGESTIONS: MediaQuerySuggestion[] = [
  { label: "Tablet and below", query: "(width < 48rem)" },
  { label: "Mobile only", query: "(width < 24rem)" },
  { label: "Dark mode", query: "(prefers-color-scheme: dark)" },
];

export default defineType({
  name: "img",
  title: "Image",
  type: "object",
  icon: VscFileMedia,
  fieldsets: [
    { name: "details" },
    {
      name: "options",
      options: { collapsed: true },
      description: "If you need to add responsive images, add them here.",
    },
    {
      name: "attributes",
      options: { columns: 2, collapsed: true },
      description: "Image attributes (alt and loading strategy)",
    },
  ],
  fields: [
    defineField({
      name: "image",
      title: "Default image",
      type: "image",
      options: {
        hotspot: true,
        metadata: ["lqip"],
      },
      fieldset: "details",
    }),
    defineField({
      name: "responsive",
      title: "Responsive images",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "responsive",
          fields: [
            defineField({
              name: "image",
              type: "image",
              options: {
                hotspot: true,
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "media",
              title: "Media query",
              type: "string",
              placeholder: `e.g. ${MEDIA_QUERY_SUGGESTIONS[0].query}`,
              validation: (Rule) => Rule.required(),
              initialValue: MEDIA_QUERY_SUGGESTIONS[0].query,
              components: {
                input: (props) => (
                  <MediaQueryInput {...props} suggestions={MEDIA_QUERY_SUGGESTIONS} />
                ),
              },
            }),
          ],
          preview: {
            select: {
              title: "media",
              media: "image",
            },
          },
        }),
      ],
      fieldset: "options",
    }),
    defineField({
      name: "alt",
      type: "string",
      description:
        "Leave empty to use the alt text set on the asset in the Media Library.",
      fieldset: "attributes",
      hidden: ({ parent }) => parent?.role === "decorative",
    }),
    // Studio unsets a cleared string, so an empty `alt` can't mean "decorative".
    defineField({
      name: "role",
      type: "string",
      description:
        'Decorative images render with alt="" and are skipped by screen readers.',
      options: {
        list: [
          { title: "Informative", value: "informative" },
          { title: "Decorative", value: "decorative" },
        ],
        layout: "radio",
      },
      fieldset: "attributes",
    }),
    defineField({
      name: "loading",
      type: "string",
      description:
        "Image loading strategy (this field will be used by developers to optimize app performance)",
      options: {
        list: ["lazy", "eager"],
        layout: "radio",
      },
      initialValue: "lazy",
      fieldset: "attributes",
    }),
  ],
  preview: {
    select: {
      image: "image",
      responsive: "responsive",
      alt: "alt",
      loading: "loading",
    },
    prepare: ({ image, responsive, alt, loading = "lazy" }) => ({
      title: alt,
      subtitle: [
        responsive && formatCount(responsive, "responsive image"),
        loading && `loading="${loading}"`,
      ]
        .filter(Boolean)
        .join(", "),
      media: image,
    }),
  },
});
