import { VscInspect } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import resolveSlug from "@/sanity/lib/resolveSlug";

export default defineType({
  name: "cta",
  title: "Call-to-action",
  icon: VscInspect,
  type: "object",
  groups: [
    {
      name: "content",
      title: "Content",
      default: true,
    },
    {
      name: "style",
      title: "Style",
    },
  ],
  fields: [
    defineField({
      name: "link",
      type: "link",
      group: "content",
    }),
    defineField({
      name: "variant",
      type: "string",
      options: {
        list: [
          "primary",
          "secondary",
          "primary-outline",
          "secondary-outline",
          "ghost",
          "link",
          "arrow-link",
          "light",
          "light-outline",
          "plain",
        ],
      },
      initialValue: "primary",
      group: "style",
    }),
    defineField({
      name: "buttonIcon",
      type: "buttonIcon",
      group: "style",
    }),
  ],
  preview: {
    select: {
      label: "link.label",
      type: "link.type",
      pageTitle: "link.internal.title",
      internal: "link.internal.metadata.slug.current",
      internalPath: "link.internalPath",
      params: "link.params",
      external: "link.external",
      fileLabel: "link.file.asset.label",
      fileOriginalFilename: "link.file.asset.originalFilename",
      variant: "variant",
    },
    prepare: ({ label, pageTitle, ...props }) => ({
      title: `${label || pageTitle} - ${props.variant}`,
      subtitle: resolveSlug({ ...props }),
    }),
  },
});
