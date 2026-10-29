import { VscSymbolVariable } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "shared-section-ref",
  title: "Shared section",
  icon: VscSymbolVariable,
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
      name: "sharedSections",
      title: "Shared sections",
      type: "array",
      group: "content",
      description:
        "Pick one or more shared sections to render here. Updates to a shared section propagate to every page that references it on the next publish.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "shared-section" }],
        }),
      ],
      validation: (Rule) =>
        Rule.required().min(1).error("Select at least one shared section"),
    }),
  ],
  preview: {
    select: {
      title: "sharedSections.0.title",
    },
    prepare: ({ title }) => ({
      title: title ?? "Shared section (none picked)",
      subtitle: "Shared section",
    }),
  },
});
