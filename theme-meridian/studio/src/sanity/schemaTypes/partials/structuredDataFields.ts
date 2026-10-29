import { defineField } from "sanity";

import SchemaPageTypeInput from "../../ui/SchemaPageTypeInput";

import { SCHEMA_ARTICLE_TYPES, SCHEMA_PAGE_TYPES } from "./schemaPageTypes";

// Add this group LAST in a document's `groups`; without it the fields land on the default tab.
export const STRUCTURED_DATA_GROUP = {
  name: "structuredData",
  title: "Structured Data",
} as const;

export const structuredDataFields = [
  defineField({
    name: "schemaPageType",
    title: "Page type",
    description:
      "What this page IS, for search engines (a schema.org WebPage subtype). Keep the default unless this is clearly an About, Contact, FAQ or Profile page. The default set in Site settings suits most pages.",
    type: "string",
    options: {
      list: SCHEMA_PAGE_TYPES.map((option) => ({ ...option })),
    },
    components: { input: SchemaPageTypeInput },
    group: STRUCTURED_DATA_GROUP.name,
  }),
];

export const schemaArticleTypeField = defineField({
  name: "schemaArticleType",
  title: "Article type",
  description:
    "The schema.org type of the article node emitted next to the page node. Empty means Article. Choose None when this entry is a landing page rather than an article.",
  type: "string",
  options: {
    layout: "radio",
    list: SCHEMA_ARTICLE_TYPES.map((option) => ({ ...option })),
  },
  group: STRUCTURED_DATA_GROUP.name,
});
