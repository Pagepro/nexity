import { VscWorkspaceTrusted } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import { formatCount } from "@/sanity/lib/utils";

import { featureIcon } from "../fragments/fields/feature-icon";

export default defineType({
  name: "trust-badges",
  title: "Trust badges",
  icon: VscWorkspaceTrusted,
  type: "object",
  groups: [{ name: "content", default: true }, { name: "options" }],
  fields: [
    defineField({
      name: "options",
      title: "Section options",
      type: "section-options",
      group: "options",
    }),
    defineField({
      name: "badges",
      title: "Badges",
      description:
        "A centred row of icon + label pairs separated by dividers, e.g. compliance and uptime claims.",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "object",
          name: "badge",
          fields: [
            featureIcon,
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (Rule) => Rule.required().error("Each badge needs a label."),
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "icon" },
            prepare: ({ title, subtitle }) => ({ title: title || "Badge", subtitle }),
          },
        }),
      ],
      validation: (Rule) => [
        Rule.required().min(1).error("Add at least one badge."),
        Rule.max(6).warning("More than 6 badges wrap onto a second line."),
      ],
    }),
  ],
  preview: {
    select: { badges: "badges" },
    prepare: ({ badges }) => ({
      title: "Trust badges",
      subtitle: badges?.length ? formatCount(badges, "badge") : "No badges yet",
    }),
  },
});
