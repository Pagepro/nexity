import { VscLink } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import resolveSlug from "@/sanity/lib/resolveSlug";

import link from "./link";

export default defineType({
  name: "headerLink",
  title: "Link",
  icon: VscLink,
  type: "object",
  options: {
    columns: 2,
  },
  fields: [
    ...link.fields,
    defineField({
      name: "visibleInMainMenu",
      type: "boolean",
      initialValue: true,
      description: "If false, the link will not be visible in the main menu",
    }),
  ],
  preview: {
    select: {
      label: "label",
      type: "type",
      title: "internal.title",
      internal: "internal.metadata.slug.current",
      internalPath: "internalPath",
      params: "params",
      external: "external",
      visibleInMainMenu: "visibleInMainMenu",
    },
    prepare: ({
      label,
      title,
      type,
      internal,
      internalPath,
      params,
      external,
      visibleInMainMenu,
    }) => ({
      title: `${visibleInMainMenu ? "Main menu | " : ""}${label || title}`,
      subtitle: resolveSlug({ type, internal, internalPath, params, external }),
    }),
  },
});
