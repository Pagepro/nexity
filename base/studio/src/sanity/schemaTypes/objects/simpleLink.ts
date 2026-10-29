import { VscLink } from "react-icons/vsc";
import { defineType } from "sanity";

import resolveSlug from "@/sanity/lib/resolveSlug";

import { linkBaseFields, linkBasePreviewSelect } from "../partials/linkBaseSchema";

export default defineType({
  name: "simpleLink",
  title: "Link",
  icon: VscLink,
  type: "object",
  fields: linkBaseFields,
  preview: {
    select: linkBasePreviewSelect,
    prepare: ({
      type,
      internal,
      internalPath,
      params,
      external,
      fileLabel,
      fileOriginalFilename,
    }) => ({
      title: "Link",
      subtitle: resolveSlug({
        type,
        internal,
        internalPath,
        params,
        external,
        fileLabel,
        fileOriginalFilename,
      }),
    }),
  },
});
