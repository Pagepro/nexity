import type { ExtractSectionProps } from "@/types/sections";

const exampleLink = {
  _type: "link",
  type: "external",
  external: "https://example.com",
  internalPath: null,
  internal: null,
  file: null,
  params: null,
  label: "Learn more",
} as const;

export const bentoGridFixture = {
  _type: "bento-grid",
  _key: "gallery-fixture-bento-grid",
  cardStyle: "card",
  linkStyle: "arrow",
  ctas: null,
  pretitle: "Capabilities",
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "section-heading-lg",
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "One platform. Every revenue signal.",
          marks: [],
        },
      ],
    },
  ],
  cards: [
    {
      _key: "card-win-loss",
      size: "wide",
      icon: "target",
      statLabel: "Win rate",
      statValue: "+43%",
      title: "Win/Loss Intelligence",
      description: "Structured surveys + AI call analysis on every closed deal.",
      link: exampleLink,
    },
    {
      _key: "card-attribution",
      size: "wide",
      icon: "chart-line",
      statLabel: "Pipeline from content",
      statValue: "2.4×",
      title: "Content Attribution",
      description: "See which content actually closes pipeline.",
      link: exampleLink,
    },
    {
      _key: "card-conversation",
      size: "regular",
      icon: "audio-waveform",
      statLabel: null,
      statValue: null,
      title: "Conversation Intelligence",
      description: "Every call, transcribed and scored.",
      link: exampleLink,
    },
    {
      _key: "card-signals",
      size: "regular",
      icon: "activity",
      statLabel: null,
      statValue: null,
      title: "Pipeline Signals",
      description: "Predictive churn and expansion alerts.",
      link: null,
    },
  ],
} satisfies ExtractSectionProps<"bento-grid">;
