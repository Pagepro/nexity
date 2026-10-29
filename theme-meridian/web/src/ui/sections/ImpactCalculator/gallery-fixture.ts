import type { ExtractSectionProps } from "@/types/sections";

export const impactCalculatorFixture = {
  _type: "impact-calculator",
  _key: "gallery-fixture-impact-calculator",
  pretitle: "Impact calculator",
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "section-heading-lg",
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "See your potential impact.",
          marks: [],
        },
      ],
    },
    {
      _type: "block",
      _key: "description",
      style: "body-3",
      children: [
        {
          _type: "span",
          _key: "description-span",
          text: "Three inputs. An honest model. Your numbers, not ours.",
          marks: [],
        },
      ],
    },
  ],
  inputsTitle: "Your team today",
  teamSizeLabel: "Sales team size",
  dealSizeLabel: "Average deal size",
  cycleLengthLabel: "Current sales-cycle length",
  resultsTitle: "Projected with Meridian",
  cycleReductionLabel: "projected cycle reduction",
  pipelineLabel: "pipeline recovered per year",
  paybackLabel: "payback period",
  cta: {
    variant: "primary",
    buttonIcon: null,
    link: {
      _type: "link",
      type: "external",
      external: "https://example.com",
      internalPath: null,
      internal: null,
      file: null,
      params: null,
      label: "Get the full model on a call",
    },
  },
  note: "Illustrative model based on median results across 2,400+ teams. Your actuals will vary.",
} satisfies ExtractSectionProps<"impact-calculator">;
