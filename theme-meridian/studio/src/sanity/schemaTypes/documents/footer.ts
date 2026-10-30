import { VscLayoutPanelOff } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "footer",
  title: "Footer settings",
  type: "document",
  icon: VscLayoutPanelOff,
  groups: [
    { name: "subscribe", title: "Subscribe band", default: true },
    { name: "navigation" },
    { name: "branding" },
  ],
  fields: [
    defineField({
      name: "subscribeHeading",
      title: "Subscribe heading",
      type: "simpleRichText",
      description:
        "Headline for the top call-to-action band (use the “Section Heading L” style). Short copy, no lists.",
      group: "subscribe",
    }),
    defineField({
      name: "subscribeCtas",
      title: "Subscribe call-to-actions",
      type: "array",
      description:
        'Buttons shown beside the heading (e.g. "Book free demo" as ghost, "Start free trial" as primary).',
      of: [{ type: "cta" }],
      validation: (Rule) => Rule.max(2),
      group: "subscribe",
    }),
    defineField({
      name: "subscribeExcludePaths",
      title: "Hide subscribe band on these paths",
      type: "array",
      description:
        'URL paths where the subscribe band is hidden. A trailing slash "/" excludes the parent path. (Mirrors Global section exclude paths.) Coming soon — runtime hiding is not wired up yet, so the band currently renders on every page.',
      of: [
        defineArrayMember({
          type: "string",
          placeholder: "e.g. pricing/, contact/",
          validation: (Rule) => Rule.required(),
        }),
      ],
      group: "subscribe",
    }),
    defineField({
      name: "social",
      type: "array",
      description:
        "Social links displayed in the footer (icons will be matched based on urls)",
      of: [{ type: "link" }],
      group: "navigation",
    }),
    defineField({
      name: "navigation",
      type: "array",
      description: "Menu displayed in the footer in columns",
      of: [
        defineField({
          name: "menu",
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Column title",
              type: "string",
              description: "Heading displayed above the links in this column",
            }),
            defineField({
              name: "links",
              title: "Menu items",
              type: "array",
              description:
                "Links displayed in the menu in a single column (it's a good practice to have no more then 5 links in a column)",
              of: [{ type: "link" }],
            }),
          ],
          preview: {
            select: {
              title: "title",
              links: "links",
            },
            prepare: ({ title, links }) => ({
              title:
                title ||
                (links?.length > 0 ? `Menu: ${links.length} elements` : "No menu items"),
              subtitle: `${links?.map((link: { label?: string }) => link.label).join(", ")}`,
            }),
          },
        }),
      ],

      group: "navigation",
    }),
    defineField({
      name: "wordmark",
      title: "Footer wordmark",
      type: "img",
      description:
        "Large decorative logo lockup shown faint across the bottom of the footer. Wide transparent PNG/SVG. Aspect ratio ~4:1, recommended 1232×300px (landscape). Optional.",
      group: "branding",
    }),
  ],
  preview: {
    prepare: () => ({
      title: "Footer settings",
    }),
  },
});
