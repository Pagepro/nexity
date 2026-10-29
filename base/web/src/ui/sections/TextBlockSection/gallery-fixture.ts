import type { ExtractSectionProps } from "@/types/sections";

export const textBlockFixture = {
  _type: "text-block",
  textAlign: "left",
  _key: "gallery-fixture-text-block",
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "section-heading-lg",
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "Built for teams who ship",
          marks: [],
        },
      ],
    },
    {
      _type: "block",
      _key: "body-1",
      style: "body-3",
      children: [
        {
          _type: "span",
          _key: "body-1-span",
          text: "Compose marketing pages from reusable blocks, edit copy without a deploy, and keep every section on-brand. Your content team moves fast while engineering stays focused.",
          marks: [],
        },
      ],
    },
    {
      _type: "block",
      _key: "body-2",
      style: "body-3",
      children: [
        {
          _type: "span",
          _key: "body-2-span",
          text: "Everything you see here is rendered straight from the CMS — no hardcoded layouts, no copy-paste components.",
          marks: [],
        },
      ],
    },
  ],
  ctas: null,
} satisfies ExtractSectionProps<"text-block">;
