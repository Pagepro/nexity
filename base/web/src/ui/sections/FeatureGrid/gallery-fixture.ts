import type { ExtractSectionProps } from "@/types/sections";
import { mockImage } from "@/ui/styleguide/sections-gallery/mock-image";

export const featureGridFixture = {
  _type: "feature-grid",
  _key: "gallery-fixture-feature-grid",
  pretitle: "Features",
  content: [
    {
      _type: "block",
      _key: "title",
      style: "section-heading-lg",
      children: [
        {
          _type: "span",
          _key: "titleSpan",
          text: "Why teams choose Acme",
          marks: [],
        },
      ],
    },
  ],
  cards: [
    {
      _key: "card1",
      _type: "card",
      eyebrow: "Win/loss intelligence",
      title: "Know the real reason deals close or stall — not what reps report",
      image: mockImage("photo", "Intelligence feed showing deal activity"),
      link: null,
    },
    {
      _key: "card2",
      _type: "card",
      eyebrow: "Content attribution",
      title: "See which assets influence pipeline, by stage, persona, and deal size",
      image: mockImage("photo", "Content attribution table"),
      link: null,
    },
    {
      _key: "card3",
      _type: "card",
      eyebrow: "Deal risk signals",
      title: "Catch at-risk opportunities before they go quiet.",
      image: mockImage("photo", "At-risk deals list"),
      link: null,
    },
  ],
} satisfies ExtractSectionProps<"feature-grid">;
