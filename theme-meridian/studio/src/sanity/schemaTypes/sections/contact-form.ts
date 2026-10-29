import { VscMail } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import { getPlainText } from "@/sanity/lib/utils";

const formInput = (name: string, title: string, label: string, placeholder: string) =>
  defineField({
    name,
    title,
    type: "object",
    group: "form",
    options: { collapsible: true, collapsed: true, columns: 2 },
    fields: [
      defineField({ name: "label", title: "Label", type: "string", initialValue: label }),
      defineField({
        name: "placeholder",
        title: "Placeholder",
        type: "string",
        initialValue: placeholder,
      }),
    ],
  });

// The form fields are fixed in code (web/src/app/actions/sales-inquiry.ts); editors own only the copy.
export default defineType({
  name: "contact-form",
  title: "Contact form",
  icon: VscMail,
  type: "object",
  groups: [
    { name: "content", title: "Heading", default: true },
    { name: "form", title: "Form" },
    { name: "options" },
  ],
  fields: [
    defineField({
      name: "options",
      title: "Section options",
      type: "section-options",
      group: "options",
    }),
    defineField({
      name: "pretitle",
      title: "Tagline",
      description: "Small uppercase label above the heading (e.g. “Contact sales”).",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "content",
      title: "Content",
      description:
        "Heading and supporting copy. Use the section-heading-lg block style for the heading.",
      type: "simpleRichText",
      group: "content",
    }),
    defineField({
      name: "bullets",
      title: "Bullet points",
      description:
        "Optional checklist under the copy, e.g. “Response within one business day”.",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      group: "content",
      validation: (Rule) => Rule.max(5).warning("Three to five bullets read best."),
    }),
    formInput("nameField", "Name field", "Full name", "Jane Doe"),
    formInput("emailField", "Email field", "Work email", "jane@company.com"),
    formInput("companyField", "Company field", "Company", "Company, Inc."),
    defineField({
      name: "teamSizeField",
      title: "Team size field",
      type: "object",
      group: "form",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: "label",
          title: "Label",
          type: "string",
          initialValue: "Team size",
        }),
        defineField({
          name: "choices",
          title: "Choices",
          description:
            "Dropdown choices, in order. The first one is preselected. Leave empty to hide the team-size field.",
          type: "array",
          of: [defineArrayMember({ type: "string" })],
          initialValue: ["1–50", "50–200", "200–500", "500–1,000", "1,000+"],
        }),
      ],
    }),
    formInput(
      "messageField",
      "Message field",
      "How can we help?",
      "Tell us about your team.",
    ),
    defineField({
      name: "submitLabel",
      title: "Submit button label",
      type: "string",
      initialValue: "Talk to sales",
      group: "form",
      validation: (Rule) => Rule.required().error("The submit button needs a label."),
    }),
    defineField({
      name: "successMessage",
      title: "Success message",
      description: "Shown in place of the form after a successful submit.",
      type: "string",
      initialValue: "Thanks! Our team will get back to you within one business day.",
      group: "form",
    }),
  ],
  preview: {
    select: { content: "content" },
    prepare: ({ content }) => ({
      title: getPlainText(content) || "Contact form",
      subtitle: "Contact form",
    }),
  },
});
