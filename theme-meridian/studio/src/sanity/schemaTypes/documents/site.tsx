import { defineArrayMember, defineField, defineType } from "sanity";

import { CharacterCountInput } from "@/sanity/ui/character-count-input";
import { OgImagePreview } from "@/sanity/ui/og-image-preview";

import {
  ROUTED_DOCUMENT_TYPES,
  SCHEMA_LOCAL_BUSINESS_TYPES,
  SCHEMA_PAGE_TYPES,
  schemaDefaultFieldName,
} from "../partials/schemaPageTypes";
import { STRUCTURED_DATA_GROUP } from "../partials/structuredDataFields";

// The Structured Data fields feed the JSON-LD graph built in `web/src/lib/schema-org/`.

export default defineType({
  name: "site",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "branding", default: true },
    { name: "seo", title: "SEO/AEO" },
    STRUCTURED_DATA_GROUP,
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
      group: "branding",
    }),
    defineField({
      name: "logo",
      description:
        "Displayed in the header. Use a transparent SVG or PNG. Recommended height ~40px; width scales with the logo's aspect ratio.",
      type: "img",
      group: "branding",
    }),
    defineField({
      name: "seo",
      title: "Default metadata",
      description: "Metadata used for all pages (can be overridden on a per-page basis)",
      type: "object",
      group: "seo",
      fields: [
        defineField({
          name: "title",
          type: "string",
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
          type: "image",
          options: {
            hotspot: true,
            metadata: ["lqip"],
          },
        }),
      ],
    }),
    defineField({
      name: "structuredData",
      title: "Structured Data",
      description:
        "What every page tells search engines and AI answer engines about the organization, as schema.org JSON-LD. The Organization fieldset is emitted on every page. Filling the street address, city and telephone upgrades it to the local-business type chosen below. Empty fields are left out of the markup, never filled with placeholders.",
      type: "object",
      group: STRUCTURED_DATA_GROUP.name,
      fieldsets: [
        {
          name: "organization",
          title: "Organization",
          description:
            "Who runs the site. Read by the Organization node on every page. The site title and header logo (Branding tab) are the fallbacks for the name and the logo.",
          options: { collapsible: true, collapsed: false },
        },
        {
          name: "defaults",
          title: "Default page types",
          description:
            "The schema.org page type each kind of document uses unless the document overrides it on its own Structured Data tab. Empty means Web Page.",
          options: { collapsible: true, collapsed: false },
        },
      ],
      fields: [
        defineField({
          name: "legalName",
          title: "Legal name",
          description:
            "The registered company name, e.g. “Acme Inc.”. Leave empty to use the site title.",
          type: "string",
          fieldset: "organization",
        }),
        defineField({
          name: "alternateName",
          title: "Alternate name",
          description: "Another name the organization is known by, if any.",
          type: "string",
          fieldset: "organization",
        }),
        defineField({
          name: "address",
          title: "Address",
          description:
            "An office a visitor can reach. Together with the telephone, this upgrades the Organization node to the local-business type below.",
          type: "object",
          fieldset: "organization",
          options: { collapsible: true, collapsed: false },
          fields: [
            defineField({
              name: "streetAddress",
              title: "Street address",
              description:
                "Street, number and floor or suite, e.g. “1 Main St, Suite 200”.",
              type: "string",
            }),
            defineField({
              name: "addressLocality",
              title: "City",
              type: "string",
            }),
            defineField({
              name: "addressRegion",
              title: "State / region",
              description: "Use the short code where there is one, e.g. “CA”.",
              type: "string",
            }),
            defineField({
              name: "postalCode",
              title: "Postal code",
              type: "string",
            }),
            defineField({
              name: "addressCountry",
              title: "Country",
              description: "Two-letter ISO code, e.g. “US” or “PL”.",
              type: "string",
              validation: (Rule) =>
                Rule.length(2).warning("Use the two-letter ISO country code."),
            }),
          ],
        }),
        defineField({
          name: "telephone",
          title: "Telephone",
          description: "International format, e.g. “+1-555-010-0000”.",
          type: "string",
          fieldset: "organization",
        }),
        defineField({
          name: "email",
          title: "Email",
          type: "string",
          validation: (Rule) => Rule.email(),
          fieldset: "organization",
        }),
        defineField({
          name: "logo",
          title: "Logo for search engines",
          description:
            "A square or near-square logo on a plain background. Aspect ratio 1:1, at least 112×112px (recommended 512×512px). Leave empty to reuse the header logo, which is usually wide and may look poor in a knowledge panel.",
          type: "img",
          fieldset: "organization",
        }),
        defineField({
          name: "foundingDate",
          title: "Founding date",
          type: "date",
          fieldset: "organization",
        }),
        defineField({
          name: "priceRange",
          title: "Price range",
          description:
            "Only emitted on the local-business type. Free text, e.g. “$$” or “From $500/month”.",
          type: "string",
          fieldset: "organization",
        }),
        defineField({
          name: "localBusinessType",
          title: "Local-business type",
          description:
            "The schema.org subtype the Organization becomes once the street address, city and telephone are all filled. Until then it stays a plain Organization, whatever is chosen here. Empty means None.",
          type: "string",
          options: {
            layout: "radio",
            list: SCHEMA_LOCAL_BUSINESS_TYPES.map((option) => ({ ...option })),
          },
          fieldset: "organization",
        }),
        defineField({
          name: "sameAs",
          title: "Social profiles",
          description:
            "Full URLs of the organization's own profiles, e.g. LinkedIn, X, Facebook, Instagram, YouTube or Crunchbase. Emitted as sameAs so search engines link these profiles to the organization.",
          type: "array",
          of: [
            defineArrayMember({
              type: "url",
              validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
            }),
          ],
          fieldset: "organization",
        }),
        defineField({
          name: "schemaDefaults",
          title: "Default page types",
          type: "object",
          fieldset: "defaults",
          fields: ROUTED_DOCUMENT_TYPES.map((documentType) =>
            defineField({
              name: schemaDefaultFieldName(documentType.name),
              title: documentType.title,
              type: "string",
              options: {
                list: SCHEMA_PAGE_TYPES.map((option) => ({ ...option })),
              },
            }),
          ),
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({
      title: "Site settings",
    }),
  },
});
