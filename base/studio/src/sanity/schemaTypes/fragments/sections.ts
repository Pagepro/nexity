import { defineField } from "sanity";

// Everything except `shared-section-ref`: the `shared-section` document uses this list so shared sections can't nest.
export const INNER_SECTIONS = [
  { type: "hero" },
  { type: "feature-block" },
  { type: "feature-grid" },
  { type: "bento-grid" },
  { type: "integrations-grid" },
  { type: "trust-badges" },
  { type: "impact-calculator" },
  { type: "contact-form" },
  { type: "logos-carousel" },
  { type: "split-sections" },
  { type: "stats" },
  { type: "cta-banner" },
  { type: "testimonials" },
  { type: "pricing" },
  { type: "faq" },
  { type: "newsletter" },
  { type: "text-block" },
  { type: "content" },
  { type: "comparison-table" },
  { type: "blog-listing" },
  { type: "case-studies-listing" },
  { type: "podcast-listing" },
];

export const SECTIONS = [...INNER_SECTIONS, { type: "shared-section-ref" }];

export default defineField({
  name: "sections",
  description: "Page content",
  type: "array",
  of: [...SECTIONS],
  options: {
    insertMenu: {
      views: [
        {
          name: "grid",
          previewImageUrl: (schemaType: string) => `/admin/thumbnails/${schemaType}.webp`,
        },
        { name: "list" },
      ],
      groups: [
        { name: "hero", of: ["hero"] },
        {
          name: "content",
          of: [
            "feature-block",
            "feature-grid",
            "bento-grid",
            "integrations-grid",
            "trust-badges",
            "impact-calculator",
            "contact-form",
            "logos-carousel",
            "split-sections",
            "stats",
            "cta-banner",
            "testimonials",
            "pricing",
            "faq",
            "newsletter",
            "text-block",
            "content",
            "comparison-table",
          ],
        },
        {
          name: "lists",
          of: ["blog-listing", "case-studies-listing", "podcast-listing"],
        },
        {
          name: "shared",
          of: ["shared-section-ref"],
        },
      ],
    },
  },
});
