import type { ExtractSectionProps } from "@/types/sections";
import { CDN_BASE, imageFromUrl } from "@/ui/styleguide/sections-gallery/mock-image";

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
          text: "Meridian shows you which content moves pipeline and what's killing it so you can win more deals in the future.",
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
    ...imageFromUrl(
      `${CDN_BASE}/0c7cedbb9c63666d1b625eb75a807cd89a2b97d8-2560x1711.jpg`,
      "",
    ),
    lqip: null,
  },
  productImage: imageFromUrl(
    `${CDN_BASE}/3ab089b592e1d35222e79eb57a167b8980c3771e-2560x1427.png`,
    "Product dashboard",
  ),
  bottomImage: imageFromUrl(
    `${CDN_BASE}/9f1ecac9f8948361bef66ff305a548452dc80c70-2560x421.png`,
    "",
  ),
} satisfies ExtractSectionProps<"hero">;
