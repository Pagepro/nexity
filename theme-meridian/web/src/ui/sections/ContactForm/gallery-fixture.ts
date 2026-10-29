import type { ExtractSectionProps } from "@/types/sections";

export const contactFormFixture = {
  _type: "contact-form",
  _key: "gallery-fixture-contact-form",
  pretitle: "Contact sales",
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "section-heading-lg",
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "Talk to our enterprise team.",
          marks: [],
        },
      ],
    },
    {
      _type: "block",
      _key: "description",
      style: "body-3",
      children: [
        {
          _type: "span",
          _key: "description-span",
          text: "Tell us about your team and we'll tailor a plan — security review included.",
          marks: [],
        },
      ],
    },
  ],
  bullets: [
    "Response within one business day",
    "Security review included in every evaluation",
  ],
  nameField: { label: "Full name", placeholder: "Jane Doe" },
  emailField: { label: "Work email", placeholder: "jane@company.com" },
  companyField: { label: "Company", placeholder: "Company, Inc." },
  teamSizeField: { label: "Team size", choices: ["200–500", "500–1,000", "1,000+"] },
  messageField: { label: "How can we help?", placeholder: "Tell us about your team." },
  submitLabel: "Talk to sales",
  successMessage: "Thanks! Our team will get back to you within one business day.",
} satisfies ExtractSectionProps<"contact-form">;
