import { VscMail } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import { getPlainText } from "@/sanity/lib/utils";

export default defineType({
  name: "newsletter",
  title: "Newsletter",
  icon: VscMail,
  type: "object",
  groups: [
    { name: "content", title: "Heading", default: true },
    { name: "form", title: "Form" },
    { name: "media", title: "Media" },
    { name: "links", title: "Links" },
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
      name: "layout",
      title: "Layout",
      description:
        "Banner = bordered card with copy on the left and the form on the right. Centered = no card; centred heading, copy, then the form with any extra buttons beside it (e.g. a closing “Book a demo” call to action).",
      type: "string",
      group: "options",
      options: {
        layout: "radio",
        list: [
          { title: "Banner", value: "banner" },
          { title: "Centered", value: "centered" },
        ],
      },
      initialValue: "banner",
    }),
    defineField({
      name: "content",
      title: "Heading & body",
      description:
        "Two-tone heading (use the “Section Heading L” style; colour the second clause with the Muted text colour) plus the supporting paragraph below it.",
      type: "simpleRichText",
      group: "content",
    }),
    defineField({
      name: "emailPlaceholder",
      title: "Email placeholder",
      description: "Placeholder shown inside the email input.",
      type: "string",
      initialValue: "your@email.com",
      group: "form",
    }),
    defineField({
      name: "submitLabel",
      title: "Submit button label",
      description: "Label for the inline subscribe button.",
      type: "string",
      initialValue: "Start free trial",
      validation: (Rule) => Rule.required().error("The button needs a label."),
      group: "form",
    }),
    defineField({
      name: "successMessage",
      title: "Success message",
      description:
        "Shown after a successful submit. Defaults to “Thanks! Check your inbox to confirm.” — change it when the form requests a demo instead.",
      type: "string",
      group: "form",
    }),
    defineField({
      name: "ctas",
      title: "Extra buttons",
      description:
        "Optional buttons shown beside the form (Centered layout only), e.g. “Talk to sales”.",
      type: "array",
      of: [{ type: "cta" }],
      group: "links",
      hidden: ({ parent }) => parent?.layout !== "centered",
      validation: (Rule) =>
        Rule.max(2).error(
          "The centered layout fits at most two buttons beside the form.",
        ),
    }),
    defineField({
      name: "socialProof",
      title: "Social proof",
      description:
        "Small print under the input (use the body-5 block style). Emphasise the count with the Strong decorator, e.g. “Read by 4,200+ leaders.”",
      type: "simpleRichText",
      group: "form",
    }),
    defineField({
      name: "backgroundImage",
      title: "Background texture",
      description:
        "Optional faint texture rendered behind the card at 15% opacity. Aspect ratio is irrelevant — it is cropped to cover. Recommended a seamless light paper texture, 1600×400px (landscape).",
      type: "img",
      group: "media",
    }),
  ],
  preview: {
    select: { content: "content" },
    prepare: ({ content }) => ({
      title: getPlainText(content) || "Newsletter",
      subtitle: "Newsletter",
    }),
  },
});
