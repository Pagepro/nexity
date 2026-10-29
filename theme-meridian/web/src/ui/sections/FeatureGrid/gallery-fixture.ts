import type { ExtractSectionProps } from "@/types/sections";
import { CDN_BASE, imageFromUrl } from "@/ui/styleguide/sections-gallery/mock-image";

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
          text: "Why teams choose Meridian",
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
      image: imageFromUrl(
        `${CDN_BASE}/f61ee323feb388a86f8f38128e10fbb739ea207d-683x512.png`,
        "Intelligence feed showing deal activity",
      ),
      link: null,
    },
    {
      _key: "card2",
      _type: "card",
      eyebrow: "Content attribution",
      title: "See which assets influence pipeline, by stage, persona, and deal size",
      image: imageFromUrl(
        `${CDN_BASE}/403779e4ed76ce2fbc3c4283ff74bf279fc66095-683x512.png`,
        "Content attribution table",
      ),
      link: null,
    },
    {
      _key: "card3",
      _type: "card",
      eyebrow: "Deal risk signals",
      title: "Catch at-risk opportunities before they go quiet.",
      image: imageFromUrl(
        `${CDN_BASE}/c6d5d9fe3bf67d94a0bdbc3efea63e279b177718-683x512.png`,
        "At-risk deals list",
      ),
      link: null,
    },
  ],
} satisfies ExtractSectionProps<"feature-grid">;
