import { VscAccount } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "author",
  title: "Author",
  type: "document",
  icon: VscAccount,
  fields: [
    defineField({
      name: "firstName",
      title: "First name",
      type: "string",
      validation: (Rule) => Rule.required().error("An author needs a first name."),
    }),
    defineField({
      name: "lastName",
      title: "Last name",
      type: "string",
      validation: (Rule) => Rule.required().error("An author needs a last name."),
    }),
    defineField({
      name: "position",
      title: "Position",
      description: "Job title, e.g. “Head of Revenue Operations”.",
      type: "string",
    }),
    defineField({
      name: "company",
      title: "Company",
      type: "string",
    }),
    defineField({
      name: "linkedinUrl",
      title: "LinkedIn URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({ scheme: ["http", "https"] }).error(
          "Enter a valid http(s) LinkedIn URL.",
        ),
    }),
    defineField({
      name: "avatar",
      title: "Avatar",
      description: "Square headshot. Aspect ratio 1:1, recommended 160×160px.",
      type: "img",
    }),
  ],
  preview: {
    select: {
      firstName: "firstName",
      lastName: "lastName",
      position: "position",
      company: "company",
      media: "avatar.image",
    },
    prepare: ({ firstName, lastName, position, company, media }) => ({
      title: [firstName, lastName].filter(Boolean).join(" ") || "Author",
      subtitle: [position, company].filter(Boolean).join(" · ") || "Author",
      media,
    }),
  },
});
