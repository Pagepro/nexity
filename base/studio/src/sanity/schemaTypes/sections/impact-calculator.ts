import { VscGraphLine } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import { getPlainText } from "@/sanity/lib/utils";

// Input ranges, defaults and the formula live in web/src/ui/sections/ImpactCalculator/model.ts.
export default defineType({
  name: "impact-calculator",
  title: "Impact calculator",
  icon: VscGraphLine,
  type: "object",
  groups: [
    { name: "content", title: "Heading", default: true },
    { name: "items", title: "Results" },
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
      description: "Small uppercase label above the heading (e.g. “Impact calculator”).",
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
      name: "inputsTitle",
      title: "Inputs card title",
      type: "string",
      initialValue: "Your team today",
      group: "form",
    }),
    defineField({
      name: "teamSizeLabel",
      title: "Team size label",
      description: "Slider from 5 to 200 reps.",
      type: "string",
      initialValue: "Sales team size",
      group: "form",
    }),
    defineField({
      name: "dealSizeLabel",
      title: "Deal size label",
      description: "Slider from $5K to $250K.",
      type: "string",
      initialValue: "Average deal size",
      group: "form",
    }),
    defineField({
      name: "cycleLengthLabel",
      title: "Cycle length label",
      description: "Slider that snaps between 4, 6, 8, 12, 16 and 24 weeks.",
      type: "string",
      initialValue: "Current sales-cycle length",
      group: "form",
    }),
    defineField({
      name: "resultsTitle",
      title: "Results card title",
      type: "string",
      initialValue: "Projected impact",
      group: "items",
    }),
    defineField({
      name: "cycleReductionLabel",
      title: "Cycle reduction label",
      type: "string",
      initialValue: "projected cycle reduction",
      group: "items",
    }),
    defineField({
      name: "pipelineLabel",
      title: "Pipeline recovered label",
      type: "string",
      initialValue: "pipeline recovered per year",
      group: "items",
    }),
    defineField({
      name: "paybackLabel",
      title: "Payback label",
      type: "string",
      initialValue: "payback period",
      group: "items",
    }),
    defineField({
      name: "cta",
      title: "Call-to-action",
      description:
        "Full-width button under the results, e.g. “Get the full model on a call”.",
      type: "cta",
      group: "links",
    }),
    defineField({
      name: "note",
      title: "Disclaimer",
      description: "Small print under the button explaining the model.",
      type: "text",
      rows: 2,
      group: "form",
    }),
  ],
  preview: {
    select: { content: "content" },
    prepare: ({ content }) => ({
      title: getPlainText(content) || "Impact calculator",
      subtitle: "Impact calculator",
    }),
  },
});
