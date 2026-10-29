import { VscUnmute } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import sections from "../fragments/sections";
import {
  STRUCTURED_DATA_GROUP,
  structuredDataFields,
} from "../partials/structuredDataFields";

export default defineType({
  name: "podcast-listing-page",
  title: "Podcast Page",
  type: "document",
  icon: VscUnmute,
  groups: [
    { name: "content", title: "Show", default: true },
    { name: "links", title: "Links" },
    { name: "metadata", title: "Metadata" },
    STRUCTURED_DATA_GROUP,
  ],
  fields: [
    defineField({
      name: "title",
      title: "Show name",
      description: "The podcast's name, e.g. “The Deal Record”. Also the H1.",
      type: "string",
      validation: (Rule) => Rule.required(),
      group: "content",
    }),
    defineField({
      name: "pretitle",
      title: "Pretitle",
      description: "Small uppercase label above the show name.",
      type: "string",
      initialValue: "Podcast",
      group: "content",
    }),
    defineField({
      name: "content",
      title: "Intro",
      description:
        "The one-sentence promise shown in the hero under the show name. Use the body-1 block style.",
      type: "simpleRichText",
      group: "content",
    }),
    defineField({
      name: "hosts",
      title: "Host",
      description: "The host, from the Authors library (name, role, avatar).",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "author" }] })],
      validation: (Rule) => Rule.max(1).warning("Only the first host is shown."),
      group: "content",
    }),
    defineField({
      name: "coverArt",
      title: "Cover art",
      description:
        "The show's artwork. Aspect ratio 1:1, recommended 1200×1200px (square). Also the fallback for episodes without their own.",
      type: "img",
      group: "content",
    }),
    defineField({
      name: "featuredEpisode",
      title: "Latest episode",
      description:
        "Pinned episode for the large card under the hero. Optional; when empty the newest published episode is shown. Excluded from the archive to avoid duplication.",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "podcast-episode" }] })],
      validation: (Rule) => Rule.max(1),
      group: "content",
    }),
    defineField({
      ...sections,
      group: "content",
    }),
    defineField({
      name: "platformLinks",
      title: "Listen on",
      description:
        "Where the show lives. Shown as buttons in the hero and as the fallback for episodes.",
      type: "array",
      of: [defineArrayMember({ type: "platformLink" })],
      validation: (Rule) =>
        Rule.max(4)
          .custom((links?: { platform?: string }[]) => {
            const platforms = (links ?? []).map((link) => link.platform).filter(Boolean);

            return new Set(platforms).size === platforms.length
              ? true
              : "One link per platform; each button is rendered once.";
          })
          .error(),
      group: "links",
    }),
    defineField({
      name: "metadata",
      type: "metadata",
      group: "metadata",
      initialValue: { slug: { _type: "slug", current: "podcast" } },
    }),
    ...structuredDataFields,
  ],
  preview: {
    select: {
      title: "title",
      media: "coverArt.image",
    },
    prepare: ({ title, media }) => ({
      title: title || "Podcast",
      subtitle: "/podcast",
      media,
    }),
  },
});
