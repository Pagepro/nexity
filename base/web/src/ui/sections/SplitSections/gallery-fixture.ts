import type { ExtractSectionProps } from "@/types/sections";
import { mockImage } from "@/ui/styleguide/sections-gallery/mock-image";

export const splitSectionsFixture = {
  _type: "split-sections",
  _key: "gallery-fixture-split-sections",
  rows: [
    {
      _key: "rowWinLoss",
      eyebrow: "Win/Loss Analysis",
      anchor: null,
      badge: null,
      comparison: null,
      bulletsTitle: null,
      proof: null,
      bullets: null,
      insight: null,
      content: [
        {
          _type: "block",
          _key: "rowWinLossH",
          style: "section-heading-lg",
          children: [
            {
              _type: "span",
              _key: "rowWinLossHs",
              text: "Know what's actually closing deals",
              marks: [],
            },
          ],
        },
        {
          _type: "block",
          _key: "rowWinLossD",
          style: "body-3",
          children: [
            {
              _type: "span",
              _key: "rowWinLossDs",
              text: "Acme connects CRM data, call recordings, and content engagement into one clear signal — so you stop relying on gut feel.",
              marks: [],
            },
          ],
        },
      ],
      ctas: [
        {
          variant: "secondary-outline",
          buttonIcon: null,
          link: {
            _type: "link",
            type: "external",
            external: "https://example.com",
            internalPath: null,
            internal: null,
            file: null,
            params: null,
            label: "See the analysis",
          },
        },
      ],
      image: mockImage("photo", "Win/loss analysis dashboard"),
    },
    {
      _key: "rowContent",
      eyebrow: "Content Intelligence",
      anchor: null,
      badge: null,
      comparison: null,
      bulletsTitle: null,
      proof: null,
      bullets: null,
      insight: null,
      content: [
        {
          _type: "block",
          _key: "rowContentH",
          style: "section-heading-lg",
          children: [
            {
              _type: "span",
              _key: "rowContentHs",
              text: "Your best content is probably invisible",
              marks: [],
            },
          ],
        },
        {
          _type: "block",
          _key: "rowContentD",
          style: "body-3",
          children: [
            {
              _type: "span",
              _key: "rowContentDs",
              text: "Acme surfaces which assets are influencing real pipeline, so marketing can create more of what works.",
              marks: [],
            },
          ],
        },
      ],
      ctas: [
        {
          variant: "secondary-outline",
          buttonIcon: null,
          link: {
            _type: "link",
            type: "external",
            external: "https://example.com",
            internalPath: null,
            internal: null,
            file: null,
            params: null,
            label: "See content attribution",
          },
        },
      ],
      image: mockImage("photo", "Content attribution dashboard"),
    },
    {
      _key: "rowForecast",
      eyebrow: "Revenue Forecasting",
      anchor: null,
      badge: null,
      comparison: null,
      bulletsTitle: null,
      proof: null,
      bullets: null,
      insight: null,
      content: [
        {
          _type: "block",
          _key: "rowForecastH",
          style: "section-heading-lg",
          children: [
            {
              _type: "span",
              _key: "rowForecastHs",
              text: "Forecast with real data",
              marks: [],
            },
          ],
        },
        {
          _type: "block",
          _key: "rowForecastD",
          style: "body-3",
          children: [
            {
              _type: "span",
              _key: "rowForecastDs",
              text: "Understand deal health across every stage and rep. Spot the gaps before they show up in the quarter.",
              marks: [],
            },
          ],
        },
      ],
      ctas: [
        {
          variant: "secondary-outline",
          buttonIcon: null,
          link: {
            _type: "link",
            type: "external",
            external: "https://example.com",
            internalPath: null,
            internal: null,
            file: null,
            params: null,
            label: "See forecasting",
          },
        },
      ],
      image: mockImage("photo", "Revenue forecasting dashboard"),
    },
  ],
} satisfies ExtractSectionProps<"split-sections">;
