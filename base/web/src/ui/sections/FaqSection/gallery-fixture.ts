import type { ExtractSectionProps } from "@/types/sections";

export const faqFixture = {
  _type: "faq",
  _key: "gallery-fixture-faq",
  pretitle: "Frequently asked questions",
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "section-heading-lg",
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "Everything you need to know",
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
          text: "Still have questions? Reach out and our team will get back to you within a day.",
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
        label: "Contact support",
      },
    },
  ],
  items: [
    {
      _key: "faq-1",
      question: "Do I need to write any code to update content?",
      answer:
        "No. Every section is editable directly in the CMS — change copy, swap images, and reorder blocks, then publish without a deploy.",
    },
    {
      _key: "faq-2",
      question: "Can I reuse sections across multiple pages?",
      answer:
        "Yes. Shared sections let you author a bundle once and reference it from any page; edits propagate everywhere on the next publish.",
    },
    {
      _key: "faq-3",
      question: "Is the site responsive out of the box?",
      answer:
        "Absolutely. Every section type is built mobile-first and adapts cleanly from phone to desktop with no extra configuration.",
    },
    {
      _key: "faq-4",
      question: "How is content delivered to visitors?",
      answer:
        "Pages are server-rendered and cached at the edge, so visitors get fast, SEO-friendly pages backed by your live content.",
    },
  ],
} satisfies ExtractSectionProps<"faq">;
