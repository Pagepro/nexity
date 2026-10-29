import type { ExtractSectionProps } from "@/types/sections";

export const sharedSectionRefFixture = {
  _type: "shared-section-ref",
  _key: "gallery-fixture-shared-section-ref",
  sharedSections: [
    {
      _id: "gallery-fixture-shared-section",
      _type: "shared-section",
      title: "Reusable promo bundle",
      sections: [
        {
          _key: "gallery-fixture-shared-inner-text-block",
          _type: "text-block",
          textAlign: "left",
          content: [
            {
              _type: "block",
              _key: "shared-heading",
              style: "section-heading-lg",
              children: [
                {
                  _type: "span",
                  _key: "shared-heading-span",
                  text: "One bundle, every page",
                  marks: [],
                },
              ],
            },
            {
              _type: "block",
              _key: "shared-body",
              style: "body-1",
              children: [
                {
                  _type: "span",
                  _key: "shared-body-span",
                  text: "Shared sections let editors author a block once and reference it from many pages — edits propagate everywhere on the next publish.",
                  marks: [],
                },
              ],
            },
          ],
          ctas: null,
        },
      ],
    },
  ],
} satisfies ExtractSectionProps<"shared-section-ref">;
