import { defineField, defineType } from "sanity";

import { makeVisibleFieldValidator, requiredField } from "@/sanity/lib/validation-utils";

export default defineType({
  name: "header",
  title: "Header settings",
  type: "document",
  groups: [{ name: "menu", default: true }, { name: "actions" }, { name: "mobile" }],
  fields: [
    defineField({
      name: "menu",
      type: "array",
      of: [{ type: "headerLink" }, { type: "headerLink.list" }],
      group: "menu",
    }),
    defineField({
      name: "ctas",
      title: "Call-to-action",
      description: "Buttons displayed in the header (on the right side)",
      type: "array",
      of: [{ type: "headerCta" }],
      validation: (Rule) =>
        Rule.max(2).error("You can only add up to 2 call-to-action buttons"),
      group: "actions",
    }),
    defineField({
      name: "searchLink",
      title: "Search link",
      type: "link",
      description:
        "Optional. Rendered as a ghost “Search” action in the header (desktop actions + mobile bar). Links to its configured destination — no search UI is built.",
      group: "actions",
    }),
    defineField({
      name: "withMobileLink",
      title: "With mobile link",
      type: "boolean",
      description: "If true, a link will be displayed in the header on mobile",
      group: "mobile",
    }),
    defineField({
      name: "linkMobile",
      title: "Header link on mobile",
      type: "link",
      description: "Link displayed in the header on mobile",
      group: "mobile",
      hidden: ({ parent }) => parent?.withMobileLink !== true,
      validation: makeVisibleFieldValidator(requiredField),
    }),
  ],
  preview: {
    prepare: () => ({
      title: "Header settings",
    }),
  },
  initialValue: {
    withMobileLink: true,
  },
});
