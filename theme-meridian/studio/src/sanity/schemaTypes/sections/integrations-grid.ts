import { VscExtensions } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import { formatCount, getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "integrations-grid",
  title: "Integrations grid",
  icon: VscExtensions,
  type: "object",
  groups: [
    { name: "content", title: "Heading", default: true },
    { name: "items", title: "Integrations" },
    { name: "form", title: "Form" },
    { name: "links", title: "Links" },
    { name: "options" },
  ],
  fields: [
    defineField({
      name: "options",
      title: "Section options",
      type: "section-options",
      group: "options",
    }),
    defineField({
      name: "pretitle",
      title: "Tagline",
      description: "Small uppercase label above the heading (e.g. “Integrations”).",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "content",
      title: "Content",
      description:
        "Section heading and supporting copy. Use the section-heading-lg block style for the heading.",
      type: "simpleRichText",
      group: "content",
    }),
    defineField({
      name: "source",
      title: "Integrations to show",
      description:
        "“All” lists every Integration document automatically (A–Z), so new ones appear without editing this section. “Pick manually” shows only the ones you choose, in your order.",
      type: "string",
      options: {
        list: [
          { title: "All integrations", value: "all" },
          { title: "Pick manually", value: "manual" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "all",
      group: "items",
    }),
    defineField({
      name: "allLabel",
      title: "“All” tab label",
      description:
        "Label of the first tab, which shows every integration. Category tabs come from the integrations shown.",
      type: "string",
      initialValue: "All",
      group: "items",
    }),
    defineField({
      name: "searchPlaceholder",
      title: "Search placeholder",
      type: "string",
      initialValue: "Search integrations",
      group: "form",
    }),
    defineField({
      name: "emptyMessage",
      title: "No results message",
      description: "Shown when the search and tab match nothing.",
      type: "string",
      initialValue: "No integrations match your search.",
      group: "form",
    }),
    defineField({
      name: "integrations",
      title: "Integrations",
      description:
        "Pick the integrations to show, in order. Each is an Integration document — edits there propagate everywhere it is referenced.",
      type: "array",
      group: "items",
      of: [defineArrayMember({ type: "reference", to: [{ type: "integration" }] })],
      // Sections saved before `source` existed have no value: they were manual.
      hidden: ({ parent }) => parent?.source === "all",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const source = (context.parent as { source?: string } | undefined)?.source;
          if (source === "all" || (value?.length ?? 0) > 0) {
            return true;
          }
          return "Pick at least one integration to display.";
        }),
    }),
    defineField({
      name: "ctas",
      title: "Call-to-actions",
      description: "Optional link below the grid, e.g. “View all 40 integrations”.",
      type: "array",
      of: [{ type: "cta" }],
      group: "links",
      validation: (Rule) => Rule.max(2),
    }),
  ],
  preview: {
    select: { content: "content", source: "source", integrations: "integrations" },
    prepare: ({ content, source, integrations }) => ({
      title: getPlainText(content) || "Integrations grid",
      subtitle:
        source === "all"
          ? "All integrations"
          : integrations?.length
            ? formatCount(integrations, "integration")
            : "Integrations grid",
    }),
  },
});
