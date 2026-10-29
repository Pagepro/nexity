import type { ExtractSectionProps } from "@/types/sections";
import { CDN_BASE, imageFromUrl } from "@/ui/styleguide/sections-gallery/mock-image";

export const newsletterFixture = {
  _type: "newsletter",
  layout: "banner",
  successMessage: null,
  ctas: null,
  _key: "gallery-fixture-newsletter",
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "section-heading-lg",
      markDefs: [
        {
          _type: "simplerColor",
          _key: "muted-color",
          label: "Custom",
          value: "rgba(120, 113, 108, 1.00)",
        },
      ],
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "Revenue intelligence. ",
          marks: [],
        },
        {
          _type: "span",
          _key: "heading-span-muted",
          text: "Once a week.",
          marks: ["muted-color"],
        },
      ],
    },
    {
      _type: "block",
      _key: "body",
      style: "normal",
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: "body-span",
          text: "The Meridian newsletter. Practical insights on win/loss, content strategy, and pipeline — every Thursday. No fluff.",
          marks: [],
        },
      ],
    },
  ],
  emailPlaceholder: "your@email.com",
  submitLabel: "Start free trial",
  socialProof: [
    {
      _type: "block",
      _key: "social-proof",
      style: "body-5",
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: "social-proof-span",
          text: "Read by 4,200+ sales and marketing leaders.\nYou can unsubscribe anytime.",
          marks: [],
        },
      ],
    },
  ],
  backgroundImage: imageFromUrl(
    `${CDN_BASE}/0281974986e68ac5e49abf4e8d0d7c9a91519ce5-2400x1800.jpg`,
    "",
  ),
} satisfies ExtractSectionProps<"newsletter">;
