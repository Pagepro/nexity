import type { ExtractSectionProps } from "@/types/sections";
import { mockImage } from "@/ui/styleguide/sections-gallery/mock-image";

export const heroFixture = {
  _type: "hero",
  _key: "gallery-fixture-hero",
  layout: "product-hero",
  logosTitle: null,
  logos: null,
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "section-heading-lg",
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "Stop guessing why you lose deals",
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
          text: "Acme shows you which content moves pipeline and what's killing it so you can win more deals in the future.",
          marks: [],
        },
      ],
    },
  ],
  ctas: [
    {
      variant: "primary",
      buttonIcon: {
        _type: "buttonIcon",
        withIcon: true,
        icon: "utility-arrow-long",
        iconPlacement: "right",
      },
      link: {
        _type: "link",
        type: "external",
        external: "https://example.com",
        internalPath: null,
        internal: null,
        file: null,
        params: null,
        label: "Start free trial",
      },
    },
    {
      variant: "ghost",
      buttonIcon: null,
      link: {
        _type: "link",
        type: "external",
        external: "https://example.com",
        internalPath: null,
        internal: null,
        file: null,
        params: null,
        label: "Book free demo",
      },
    },
  ],
  image: {
    ...mockImage("backdrop", ""),
    lqip: null,
  },
  productImage: mockImage("screen", "Product dashboard"),
  bottomImage: mockImage("strip", ""),
} satisfies ExtractSectionProps<"hero">;
