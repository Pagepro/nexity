import type { ExtractSectionProps } from "@/types/sections";

export const statsFixture = {
  _type: "stats",
  layout: "grid",
  textAlign: null,
  _key: "gallery-fixture-stats",
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "section-heading-lg",
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "Trusted at scale",
          marks: [],
        },
      ],
    },
    {
      _type: "block",
      _key: "body",
      style: "body-3",
      children: [
        {
          _type: "span",
          _key: "body-span",
          text: "Teams of every size build and ship faster on a composable content foundation.",
          marks: [],
        },
      ],
    },
  ],
  stats: [
    {
      _key: "stat-uptime",
      value: "99.99%",
      label: "Uptime across all regions",
    },
    {
      _key: "stat-pages",
      value: "12k+",
      label: "Pages published",
    },
    {
      _key: "stat-faster",
      value: "3x",
      label: "Faster time to launch",
    },
    {
      _key: "stat-teams",
      value: "500+",
      label: "Teams onboarded",
    },
  ],
} satisfies ExtractSectionProps<"stats">;
