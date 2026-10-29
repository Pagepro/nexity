import { VscUnmute, VscWatch } from "react-icons/vsc";
import { defineArrayMember, defineField, defineType } from "sanity";

import {
  STRUCTURED_DATA_GROUP,
  structuredDataFields,
} from "../partials/structuredDataFields";

// Values MUST stay in sync with the web `PodcastListingSection/constants.ts` TOPICS and the
// `/api/podcast/episodes` GROQ filter. Example topics: replace them with your own.
export const EPISODE_TOPICS = [
  { title: "Win/loss", value: "Win/loss" },
  { title: "Attribution", value: "Attribution" },
  { title: "Conversation", value: "Conversation" },
  { title: "Signals", value: "Signals" },
  { title: "RevOps", value: "RevOps" },
] as const;

export default defineType({
  name: "podcast-episode",
  title: "Podcast episode",
  type: "document",
  icon: VscUnmute,
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "listing", title: "Listing" },
    { name: "links", title: "Links" },
    { name: "metadata", title: "Metadata" },
    STRUCTURED_DATA_GROUP,
  ],
  fields: [
    defineField({
      name: "episodeNumber",
      title: "Episode number",
      description: "Counts across seasons (Ep. 14), shown on every card and row.",
      type: "number",
      validation: (Rule) =>
        Rule.required()
          .integer()
          .positive()
          .error("The episode number is shown on every card and row."),
      group: "listing",
    }),
    defineField({
      name: "season",
      title: "Season",
      description:
        "Season number. Seasons have no page of their own; the archive filters by it.",
      type: "number",
      initialValue: 1,
      validation: (Rule) =>
        Rule.required().integer().positive().error("The archive filters by season."),
      group: "listing",
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) =>
        Rule.required().error(
          "The archive and the latest-episode card sort by this date.",
        ),
      group: "listing",
    }),
    defineField({
      name: "durationMinutes",
      title: "Duration (minutes)",
      description: "Rounded to whole minutes; shown as “38 min”.",
      type: "number",
      validation: (Rule) =>
        Rule.required().integer().positive().error("The duration is shown on every row."),
      group: "listing",
    }),
    defineField({
      name: "topic",
      title: "Topic",
      description:
        "The capability the episode covers. Drives the archive filter. Values must stay in sync with web PodcastListingSection/constants.ts TOPICS and the /api/podcast/episodes GROQ filter.",
      type: "string",
      options: {
        list: EPISODE_TOPICS.map((option) => ({ ...option })),
        layout: "radio",
      },
      validation: (Rule) =>
        Rule.required().error("The topic drives the archive filter and the row marker."),
      group: "listing",
    }),
    defineField({
      name: "guests",
      title: "Guest",
      description:
        "The episode's guest, from the Authors library (name, role, company, avatar).",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "author" }] })],
      validation: (Rule) => Rule.max(1).warning("Only the first guest is shown."),
      group: "listing",
    }),
    defineField({
      name: "summary",
      title: "Summary",
      description:
        "One or two sentences shown on the latest-episode card, in the archive and used for SEO.",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(280).warning("Keep summaries short."),
      group: "listing",
    }),
    defineField({
      name: "coverArt",
      title: "Cover art",
      description:
        "Optional episode artwork. Aspect ratio 1:1, recommended 1200×1200px (square); on the latest-episode card it is cropped to a landscape panel, so keep the subject centred. Without it the card shows the episode number and chapters.",
      type: "img",
      group: "listing",
    }),
    defineField({
      name: "chapters",
      title: "Chapters",
      description: "Timestamps shown on the latest-episode card and the episode page.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "chapter",
          icon: VscWatch,
          fieldsets: [{ name: "row", options: { columns: 2 } }],
          fields: [
            defineField({
              name: "timestamp",
              title: "Timestamp",
              description: "mm:ss, e.g. 14:22",
              type: "string",
              fieldset: "row",
              validation: (Rule) =>
                Rule.required()
                  .regex(/^\d{1,2}:\d{2}(:\d{2})?$/, {
                    name: "timestamp",
                    invert: false,
                  })
                  .error("Use mm:ss (e.g. 14:22) or hh:mm:ss."),
            }),
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              fieldset: "row",
              validation: (Rule) => Rule.required().error("A chapter needs a title."),
            }),
          ],
          preview: {
            select: { timestamp: "timestamp", title: "title" },
            prepare: ({ timestamp, title }) => ({
              title: title || "Chapter",
              subtitle: timestamp,
            }),
          },
        }),
      ],
      group: "content",
    }),
    defineField({
      name: "showNotes",
      title: "Show notes",
      description: "The episode page body: what was discussed, links, takeaways.",
      type: "pageRichText",
      group: "content",
    }),
    defineField({
      name: "transcript",
      title: "Transcript",
      description:
        "Optional full transcript, shown below the show notes on the episode page.",
      type: "pageRichText",
      group: "content",
    }),
    defineField({
      name: "platformLinks",
      title: "Listen on",
      description:
        "Links to this episode on each platform. The show-level links are the fallback.",
      type: "array",
      of: [defineArrayMember({ type: "platformLink" })],
      group: "links",
    }),
    defineField({
      name: "metadata",
      type: "metadata",
      group: "metadata",
    }),
    ...structuredDataFields,
  ],
  orderings: [
    {
      title: "Published, newest first",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    {
      title: "Episode number, highest first",
      name: "episodeNumberDesc",
      by: [{ field: "episodeNumber", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "metadata.title",
      episodeNumber: "episodeNumber",
      topic: "topic",
      media: "coverArt.image",
    },
    prepare: ({ title, episodeNumber, topic, media }) => ({
      title: title || "Untitled episode",
      subtitle: [episodeNumber ? `Ep. ${episodeNumber}` : null, topic]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});
