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

const FORM_TYPES = [
  { title: "Contact: email the message to sales", value: "contact" },
  { title: "Gated content: unlock a resource after submit", value: "gated" },
];

const isGated = (parent: unknown) =>
  (parent as { formType?: string } | undefined)?.formType === "gated";

// The form fields are fixed in code (web/src/app/actions/submit-form.tsx); editors own only the copy.
export default defineType({
  name: "form",
  title: "Form",
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
      name: "formType",
      title: "Form type",
      description:
        "Both types look the same and send the lead to sales. Gated content then shows the picked resource (thank-you copy and files) in place of the form.",
      type: "string",
      options: { list: FORM_TYPES, layout: "radio" },
      initialValue: "contact",
      group: "form",
      validation: (Rule) =>
        Rule.required().error("Pick what the form does after a submit."),
    }),
    defineField({
      name: "resources",
      title: "Gated resource",
      description:
        "What the form unlocks: thank-you copy and files to download. Edit it under Collections → Gated resources.",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "gated-resource" }] })],
      group: "form",
      hidden: ({ parent }) => !isGated(parent),
      validation: (Rule) =>
        Rule.max(1).custom((value, context) =>
          !isGated(context.parent) || (value?.length ?? 0) > 0
            ? true
            : "Pick the resource this form unlocks, or the visitor gets nothing after submitting.",
        ),
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
      hidden: ({ parent }) => isGated(parent),
    }),
  ],
  preview: {
    select: { content: "content", formType: "formType", resource: "resources.0.title" },
    prepare: ({ content, formType, resource }) => ({
      title: getPlainText(content) || "Form",
      subtitle:
        formType === "gated"
          ? `Gated content form${resource ? ` · ${resource}` : ""}`
          : "Contact form",
    }),
  },
});
