import { VscArrowSwap } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

import { validateUnreservedSource } from "@/sanity/lib/reserved-paths";
import resolveSlug from "@/sanity/lib/resolveSlug";

export default defineType({
  name: "rewrite",
  title: "Rewrite",
  icon: VscArrowSwap,
  type: "document",
  description:
    "Serves another URL's content under a path on this site, without changing the address in the browser. For example, /some-file.pdf → a file uploaded to Sanity.",
  fields: [
    defineField({
      name: "source",
      description: (
        <>
          The path on this site, e.g. <code>/some-file.pdf</code>,{" "}
          <code>/docs/:path*</code>. A rewrite replaces any page that already lives at
          this path.
        </>
      ),
      placeholder: "e.g. /some-file.pdf, /docs/:path*",
      type: "string",
      validation: (Rule) => [
        Rule.required().error("A rewrite without a source path never fires"),
        Rule.custom((source) =>
          !source || (source.startsWith("/") && !source.startsWith("//"))
            ? true
            : 'The source must be a path on this site, starting with a single "/"',
        ),
        Rule.custom(validateUnreservedSource),
      ],
    }),
    defineField({
      name: "destination",
      description: (
        <>
          <p>
            The content to serve. A page, a path, an external URL or a file. Pattern
            parameters from the source can be reused, e.g.{" "}
            <code>https://docs.example.com/:path*</code>.
          </p>
          <p>
            Rewrites apply on the live site about two minutes after publishing, with no
            rebuild. An external URL is fetched by the site server; visitors&apos; cookies
            are not sent to it.
          </p>
          <p>
            Best for files and single resources. A whole external website usually loads
            its scripts and styles from its own root (e.g. <code>/_next/…</code>), which
            this site does not serve, so the page shows without them.
          </p>
        </>
      ),
      type: "simpleLink",
      validation: (Rule) => Rule.required().error("A rewrite needs content to serve"),
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
      fileLabel: "destination.file.asset.label",
      fileOriginalFilename: "destination.file.asset.originalFilename",
    },
    prepare: ({
      title,
      type,
      internal,
      internalPath,
      params,
      external,
      fileLabel,
      fileOriginalFilename,
    }) => ({
      title,
      subtitle: `serves ${resolveSlug({
        type,
        internal,
        internalPath,
        params,
        external,
        fileLabel,
        fileOriginalFilename,
      })}`,
    }),
  },
});
