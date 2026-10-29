// `testimonials` holds dereferenced testimonial objects (resolved `_id` + fields), not references.
import type { ExtractSectionProps } from "@/types/sections";
import { mockImage } from "@/ui/styleguide/sections-gallery/mock-image";

export const testimonialsFixture = {
  _type: "testimonials",
  layout: "carousel",
  mark: null,
  _key: "gallery-fixture-testimonials",
  pretitle: "Loved by teams",
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "section-heading-lg",
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "What our customers say",
          marks: [],
        },
      ],
    },
  ],
  testimonials: [
    {
      _id: "gallery-testimonial-1",
      author: "Maya Chen",
      role: "Head of Marketing",
      company: "Northwind",
      quote: [
        {
          _type: "block",
          _key: "quote-1",
          style: "body-1",
          children: [
            {
              _type: "span",
              _key: "quote-1-span",
              text: "We launched our new site in days, not months. The composable sections let our team iterate without ever touching code.",
              marks: [],
            },
          ],
        },
      ],
      avatar: mockImage("square", "Maya Chen"),
    },
    {
      _id: "gallery-testimonial-2",
      author: "Diego Alvarez",
      role: "Product Lead",
      company: "Lumen Labs",
      quote: [
        {
          _type: "block",
          _key: "quote-2",
          style: "body-1",
          children: [
            {
              _type: "span",
              _key: "quote-2-span",
              text: "The editing experience is the best we've used. Our content team ships landing pages on their own now.",
              marks: [],
            },
          ],
        },
      ],
      avatar: mockImage("square", "Diego Alvarez"),
    },
    {
      _id: "gallery-testimonial-3",
      author: "Priya Nair",
      role: "Founder",
      company: "Cobalt",
      quote: [
        {
          _type: "block",
          _key: "quote-3",
          style: "body-1",
          children: [
            {
              _type: "span",
              _key: "quote-3-span",
              text: "Beautiful out of the box and endlessly flexible. It's become the backbone of every campaign we run.",
              marks: [],
            },
          ],
        },
      ],
      avatar: mockImage("square", "Priya Nair"),
    },
    {
      _id: "gallery-testimonial-4",
      author: "Tom Becker",
      role: "Growth Manager",
      company: "Vertex",
      quote: [
        {
          _type: "block",
          _key: "quote-4",
          style: "body-1",
          children: [
            {
              _type: "span",
              _key: "quote-4-span",
              text: "Page speed and SEO improved overnight, and we finally retired our old patchwork of landing-page tools.",
              marks: [],
            },
          ],
        },
      ],
      avatar: mockImage("square", "Tom Becker"),
    },
    {
      _id: "gallery-testimonial-5",
      author: "Sofia Rossi",
      role: "Brand Director",
      company: "Aurora",
      quote: [
        {
          _type: "block",
          _key: "quote-5",
          style: "body-1",
          children: [
            {
              _type: "span",
              _key: "quote-5-span",
              text: "Our designers and marketers finally speak the same language — the section library keeps everything on-brand.",
              marks: [],
            },
          ],
        },
      ],
      avatar: mockImage("square", "Sofia Rossi"),
    },
    {
      _id: "gallery-testimonial-6",
      author: "James Okafor",
      role: "VP Engineering",
      company: "Meridian",
      quote: [
        {
          _type: "block",
          _key: "quote-6",
          style: "body-1",
          children: [
            {
              _type: "span",
              _key: "quote-6-span",
              text: "Type-safe content with previews that never go stale. Onboarding new editors takes minutes now.",
              marks: [],
            },
          ],
        },
      ],
      avatar: mockImage("square", "James Okafor"),
    },
  ],
} satisfies ExtractSectionProps<"testimonials">;
