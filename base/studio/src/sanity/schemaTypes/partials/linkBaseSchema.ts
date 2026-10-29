import { defineField, FileRule, ReferenceRule, StringRule } from "sanity";

import {
  externalLinkValidator,
  internalPathValidator,
  makeVisibleFieldValidator,
  requiredField,
} from "@/sanity/lib/validation-utils";

export const linkBaseFields = [
  defineField({
    name: "type",
    type: "string",
    options: {
      layout: "radio",
      list: [
        { title: "internal", value: "internal" },
        { title: "internal path", value: "path" },
        { title: "external", value: "external" },
        { title: "download", value: "download" },
      ],
    },
    initialValue: "internal",
  }),
  defineField({
    name: "internal",
    type: "reference",
    title: "Internal page",
    description: "Select a page within this domain",
    to: [
      { type: "page" },
      { type: "blog-listing-page" },
      { type: "case-studies-listing-page" },
      { type: "case-study" },
      { type: "post" },
      { type: "podcast-listing-page" },
      { type: "podcast-episode" },
    ],
    hidden: ({ parent }) => parent?.type !== "internal",
    validation: makeVisibleFieldValidator<ReferenceRule>(requiredField),
  }),
  defineField({
    name: "internalPath",
    title: "Internal path",
    description:
      "Site-relative path to a page on this site, e.g. /contact. Use when there is no document to reference. Add #jump-link or ?foo=bar under URL parameters.",
    placeholder: "/contact",
    type: "string",
    hidden: ({ parent }) => parent?.type !== "path",
    validation: makeVisibleFieldValidator<StringRule>((rule) =>
      rule.custom((value) => internalPathValidator(value)).required(),
    ),
  }),
  defineField({
    name: "external",
    title: "External URL",
    description: "URL must start with http | https | mailto | tel to be valid.",
    placeholder: "https://example.com",
    type: "string",
    validation: makeVisibleFieldValidator<StringRule>((rule) =>
      rule.custom((value) => externalLinkValidator(value)).required(),
    ),
    hidden: ({ parent }) => parent?.type !== "external",
  }),
  defineField({
    name: "file",
    title: "File",
    description: "Please select a file to download",
    type: "file",
    validation: makeVisibleFieldValidator<FileRule>((rule) =>
      rule.custom((value) => externalLinkValidator(value)).required(),
    ),
    hidden: ({ parent }) => parent?.type !== "download",
  }),
  defineField({
    name: "params",
    title: "URL parameters",
    placeholder: "e.g. #jump-link or ?foo=bar",
    type: "string",
    hidden: ({ parent }) => parent?.type !== "internal" && parent?.type !== "path",
  }),
];

export const linkBasePreviewSelect = {
  type: "type",
  title: "internal.title",
  internal: "internal.metadata.slug.current",
  internalPath: "internalPath",
  params: "params",
  external: "external",
  fileLabel: "file.asset.label",
  fileOriginalFilename: "file.asset.originalFilename",
};
