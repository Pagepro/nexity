import type { ExtractSectionProps } from "@/types/sections";
import { mockImage } from "@/ui/styleguide/sections-gallery/mock-image";

export const ctaBannerFixture = {
  _type: "cta-banner",
  _key: "gallery-fixture-cta-banner",
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "section-heading-lg",
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "Your pipeline shouldn't feel like a desert",
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
          text: "Connect your CRM and get your first win/loss report in under 24 hours.",
          marks: [],
        },
      ],
    },
  ],
  ctas: [
    {
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
  backgroundImage: mockImage("backdrop", ""),
  image: mockImage("screen", "Product dashboard"),
} satisfies ExtractSectionProps<"cta-banner">;
