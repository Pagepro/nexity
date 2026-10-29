import { VscGlobe } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import { CharacterCountInput } from "@/sanity/ui/character-count-input";
import { OgImagePreview } from "@/sanity/ui/og-image-preview";
import { SearchAppearanceInput } from "@/sanity/ui/searchAppearance";

// Fixed-URL singletons only: routed documents (post, case-study, …) route via this slug and need it editable.
const READONLY_SLUG_DOCUMENT_TYPES = [
  "blog-listing-page",
  "case-studies-listing-page",
  "podcast-listing-page",
];

export default defineType({
  name: "metadata",
  title: "Metadata",
  description: "For search engines",
  type: "object",
  components: {
    input: SearchAppearanceInput,
  },
  // Every field here must also be projected by METADATA_FRAGMENT
  // (web/src/sanity/lib/fragments/metadata.ts), or it silently does nothing.
  fields: [
    defineField({
      name: "slug",
      type: "slug",
      description:
        "URL slug. Blog posts, case studies and podcast episodes are automatically prefixed — the final URL is /blog/{slug}, /case-studies/{slug} and /podcast/{slug} respectively (enter just the slug, e.g. “my-article”). For pages this is the full path without a leading slash (e.g. “about” or “company/team”); the home page is “/”.",
      readOnly: ({ document }) =>
        READONLY_SLUG_DOCUMENT_TYPES.includes(document?._type ?? ""),
      options: {
        source: (doc: any) => doc.title || doc.metadata.title,
      },
      // Routes and the sitemap match the slug as stored: "/about" never resolves and maps to "//about".
      validation: (Rule) => [
        Rule.required(),
        Rule.custom((slug) => {
          const current = slug?.current;
          if (!current || current === "/") return true;

          return current.startsWith("/") || current.endsWith("/")
            ? `Remove the leading and trailing slashes: “${current.replace(/^\/+|\/+$/g, "")}”.`
            : true;
        }),
      ],
    }),
    defineField({
      // Stays optional: required() would flip the generated type non-null everywhere (root AGENTS.md).
      name: "title",
      type: "string",
      description:
        "The document's name — renders as the page H1 and the social-card title. Also the search-result title unless “SEO title” is set.",
      validation: (Rule) => Rule.max(60).warning(),
      components: {
        input: (props) => (
          <CharacterCountInput {...props} limit={60}>
            <OgImagePreview title={props.elementProps.value} />
          </CharacterCountInput>
        ),
      },
    }),
    defineField({
      name: "seoTitle",
      title: "SEO title",
      description:
        "Overrides the browser tab / search-result title only. Leave empty to use the title above. The site name is appended automatically.",
      type: "string",
      validation: (Rule) => Rule.max(60).warning(),
      components: {
        input: (props) => <CharacterCountInput {...props} limit={60} />,
      },
    }),
    defineField({
      name: "description",
      type: "text",
      validation: (Rule) => Rule.max(160).warning(),
      components: {
        input: (props) => <CharacterCountInput {...props} limit={160} multiline />,
      },
    }),
    defineField({
      name: "image",
      description:
        "Used for social sharing previews (Open Graph). Aspect ratio 1.91:1, recommended 1200×630px (landscape).",
      type: "img",
      options: {
        hotspot: true,
        metadata: ["lqip"],
      },
    }),
    defineField({
      name: "canonical",
      title: "Canonical URL",
      description:
        "Leave empty to use this page's own URL (the default). Set an absolute URL only to point search engines at another page as the authoritative version (duplicate or syndicated content). A page with this set is also left out of the sitemap.",
      type: "url",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "noIndex",
      description:
        "Prevent search engines from indexing this page. Also leaves it out of the sitemap.",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "noFollow",
      description: "Ask search engines not to follow the links on this page.",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "hreflang",
      title: "Language/region alternates (hreflang)",
      description:
        "Only needed when the same content exists at other URLs for other languages or regions. Map each language/region code to its absolute URL; add “x-default” for the fallback. Leave empty on single-language sites.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "alternate",
          icon: VscGlobe,
          fields: [
            defineField({
              name: "hreflang",
              title: "Language/region code",
              description: "BCP-47 code, e.g. “en”, “en-GB”, “de-DE”, or “x-default”.",
              type: "string",
              validation: (Rule) =>
                Rule.required().error("A code is required, or the alternate is ignored."),
            }),
            defineField({
              name: "href",
              title: "URL",
              description: "Absolute URL of the alternate version.",
              type: "url",
              validation: (Rule) =>
                Rule.required()
                  .uri({ scheme: ["http", "https"] })
                  .error(
                    "An absolute http(s) URL is required, or the alternate is ignored.",
                  ),
            }),
          ],
          preview: {
            select: { title: "hreflang", subtitle: "href" },
          },
        }),
      ],
    }),
  ],
});
