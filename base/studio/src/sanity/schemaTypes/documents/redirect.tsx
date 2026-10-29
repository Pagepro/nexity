import { PiFlowArrow } from "react-icons/pi";
import { defineField, defineType } from "sanity";

import { validateUnreservedSource } from "@/sanity/lib/reserved-paths";
import resolveSlug from "@/sanity/lib/resolveSlug";

const regex = /^(\/|https?:\/\/)/;

export default defineType({
  name: "redirect",
  title: "Redirect",
  icon: PiFlowArrow,
  type: "document",
  fields: [
    defineField({
      name: "source",
      description: "Redirect from",
      placeholder: "e.g. /old-path, /old-blog/:slug",
      type: "string",
      validation: (Rule) => [
        Rule.required().regex(regex),
        Rule.custom(validateUnreservedSource),
      ],
    }),
    defineField({
      name: "destination",
      description: "Redirect to",
      type: "simpleLink",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "permanent",
      type: "boolean",
      initialValue: true,
      description: (
        <>
          <p>
            If <code>true</code> the redirect answers with <code>308</code> (permanent):
            browsers and search engines cache it and move ranking to the destination. If{" "}
            <code>false</code> it answers with <code>307</code> (temporary) and is not
            cached.
          </p>
          <p>
            Redirects apply on the live site about two minutes after publishing, with no
            rebuild. The source can be an exact path (<code>/old-path</code>), a pattern (
            <code>/old-blog/:slug</code>, <code>/docs/:path*</code>) or a path with
            required query parameters (<code>/old?ref=newsletter</code>). A chain (A to B,
            B to C) is served as a single hop to C, and a loop is ignored.
          </p>
        </>
      ),
    }),
  ],
  preview: {
    select: {
      title: "source",
      type: "destination.type",
      internal: "destination.internal.metadata.slug.current",
      internalPath: "destination.internalPath",
      params: "destination.params",
      external: "destination.external",
    },
    prepare: ({ title, type, internal, internalPath, params, external }) => ({
      title,
      subtitle:
        (external || internal || internalPath) &&
        `to ${external || resolveSlug({ type, internal, internalPath, params })}`,
    }),
  },
});
