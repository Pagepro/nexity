import { VscCloudDownload, VscFile } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

// Soft gate: the page never carries this content, but the files themselves are public on the
// Sanity CDN to anyone who has their URL. Truly private files need Media Library signed URLs.
export default defineType({
  name: "gated-resource",
  title: "Gated resource",
  icon: VscCloudDownload,
  type: "document",
  fields: [
    defineField({
      name: "title",
      description:
        "Name of the resource, e.g. “2026 Sales Benchmark Report”. Not shown on the site; it goes into the lead email subject.",
      type: "string",
      validation: (Rule) =>
        Rule.required().error(
          "Name the resource so sales know what the lead downloaded.",
        ),
    }),
    defineField({
      name: "content",
      title: "Thank-you content",
      description:
        "Shown in place of the form after a submit, above the files. Use the section-heading-sm block style for the heading.",
      type: "simpleRichText",
    }),
    defineField({
      name: "files",
      description: "Files to download, in order.",
      type: "array",
      of: [
        defineArrayMember({
          name: "gatedFile",
          title: "File",
          type: "object",
          icon: VscFile,
          fields: [
            defineField({
              name: "label",
              description: "Link text, e.g. “Full report (PDF)”.",
              type: "string",
              validation: (Rule) =>
                Rule.required().error("The download link needs a label."),
            }),
            defineField({
              name: "file",
              type: "file",
              options: { storeOriginalFilename: true },
              validation: (Rule) => Rule.required().error("Upload the file to download."),
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "file.asset.originalFilename" },
          },
        }),
      ],
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .error("A gated resource needs at least one file to download."),
    }),
  ],
  preview: {
    select: { title: "title", files: "files" },
    prepare: ({ title, files }) => {
      const count = Array.isArray(files) ? files.length : 0;
      return {
        title: title || "Gated resource",
        subtitle: `${count} ${count === 1 ? "file" : "files"}`,
      };
    },
  },
});
