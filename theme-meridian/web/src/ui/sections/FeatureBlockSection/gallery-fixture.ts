import type { ExtractSectionProps } from "@/types/sections";
import { mockImage } from "@/ui/styleguide/sections-gallery/mock-image";

export const featureBlockFixture = {
  _type: "feature-block",
  _key: "gallery-fixture-feature-block",
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "section-heading-lg",
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "Everything your team needs to ship",
          marks: [],
        },
      ],
    },
    {
      _type: "block",
      _key: "body",
      style: "body-2",
      children: [
        {
          _type: "span",
          _key: "body-span",
          text: "Compose pages from reusable sections, edit content in the CMS, and publish instantly — all in one workflow.",
          marks: [],
        },
      ],
    },
  ],
  ctas: [
    {
      variant: "primary",
      link: {
        _type: "link",
        type: "external",
        external: "https://example.com",
        internalPath: null,
        internal: null,
        file: null,
        params: null,
        label: "Explore features",
      },
    },
  ],
  images: [
    {
      _key: "image-1",
      ...mockImage("landscape", "Feature workflow screenshot"),
    },
    {
      _key: "image-2",
      ...mockImage("square", "Team collaboration view"),
    },
  ],
  imageLayout: "grid",
} satisfies ExtractSectionProps<"feature-block">;
