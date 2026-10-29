import { VscCreditCard } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import { formatCount, getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "pricing",
  title: "Pricing",
  icon: VscCreditCard,
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
      name: "pretitle",
      title: "Tagline",
      description: "Short uppercase label above the heading, e.g. “Pricing”.",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "content",
      title: "Content",
      description:
        "Section heading and supporting copy. Use the “Section Heading L” style for the heading.",
      type: "simpleRichText",
      group: "content",
    }),
    defineField({
      name: "monthlyLabel",
      title: "Monthly toggle label",
      description:
        "Label for the monthly billing tab. The Monthly/Yearly toggle only appears when at least one plan defines a yearly price.",
      type: "string",
      initialValue: "Monthly",
      group: "content",
    }),
    defineField({
      name: "yearlyLabel",
      title: "Yearly toggle label",
      description: "Label for the yearly billing tab, e.g. “Yearly (Save 20%)”.",
      type: "string",
      initialValue: "Yearly (Save 20%)",
      group: "content",
    }),
    defineField({
      name: "plans",
      title: "Plans",
      description:
        "Renders as a 3-column grid on desktop, stacking to 1 column on mobile.",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "object",
          name: "plan",
          fields: [
            defineField({
              name: "name",
              title: "Plan name",
              type: "string",
              validation: (Rule) => Rule.required().error("Each plan needs a name."),
            }),
            defineField({
              name: "description",
              title: "Plan description",
              description: "One short sentence describing who the plan is for.",
              type: "text",
              rows: 2,
            }),
            defineField({
              name: "monthlyPrice",
              title: "Price",
              description: "Displayed price, e.g. “$499” or “Custom”.",
              type: "string",
              validation: (Rule) => Rule.required().error("Each plan needs a price."),
            }),
            defineField({
              name: "yearlyPrice",
              title: "Yearly price",
              description:
                "Shown when the Yearly tab is selected. Leave blank for fixed-price plans (e.g. “Custom”) — the price then stays the same on both tabs.",
              type: "string",
            }),
            defineField({
              name: "priceSuffix",
              title: "Price suffix",
              description:
                "Small text after the price, e.g. “/mo.”. Leave blank for “Custom”.",
              type: "string",
            }),
            defineField({
              name: "badge",
              title: "Highlight badge",
              description:
                "Optional corner badge, e.g. “Most popular”. Use the plan's CTA variant (primary) to visually emphasise the featured plan.",
              type: "string",
            }),
            defineField({
              name: "cta",
              title: "Call-to-action",
              type: "cta",
            }),
            defineField({
              name: "featuresTitle",
              title: "Features title",
              type: "string",
              initialValue: "Includes:",
            }),
            defineField({
              name: "features",
              title: "Features",
              description: "Checklist of what the plan includes.",
              type: "array",
              of: [defineArrayMember({ type: "string" })],
            }),
          ],
          preview: {
            select: { title: "name", subtitle: "monthlyPrice", badge: "badge" },
            prepare: ({ title, subtitle, badge }) => ({
              title: title || "Plan",
              subtitle: [subtitle, badge && `· ${badge}`].filter(Boolean).join(" "),
            }),
          },
        }),
      ],
      validation: (Rule) =>
        Rule.required().min(1).max(4).error("Add between 1 and 4 plans."),
    }),
    defineField({
      name: "footnote",
      title: "Footnote",
      description:
        "Small centered text below the plans, e.g. “All plans include a 14-day free trial.”",
      type: "string",
      group: "content",
    }),
  ],
  preview: {
    select: { content: "content", plans: "plans" },
    prepare: ({ content, plans }) => ({
      title: getPlainText(content) || "Pricing",
      subtitle: plans?.length ? formatCount(plans, "plan") : "Pricing",
    }),
  },
});
