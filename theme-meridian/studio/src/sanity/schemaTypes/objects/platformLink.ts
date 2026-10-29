import { VscLink } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

export const PODCAST_PLATFORMS = [
  { title: "Spotify", value: "spotify" },
  { title: "Apple Podcasts", value: "apple" },
  { title: "YouTube", value: "youtube" },
  { title: "RSS", value: "rss" },
] as const;

export type PodcastPlatform = (typeof PODCAST_PLATFORMS)[number]["value"];

export default defineType({
  name: "platformLink",
  title: "Platform link",
  type: "object",
  icon: VscLink,
  fields: [
    defineField({
      name: "platform",
      title: "Platform",
      type: "string",
      options: {
        list: PODCAST_PLATFORMS.map((option) => ({ ...option })),
        layout: "radio",
      },
      validation: (Rule) =>
        Rule.required().error("Pick the platform; it sets the button label and icon."),
    }),
    defineField({
      name: "url",
      title: "URL",
      description:
        "The show page (on the podcast page) or the episode page (on an episode).",
      type: "url",
      validation: (Rule) =>
        Rule.required()
          .uri({ scheme: ["http", "https"] })
          .error("Enter a valid http(s) URL."),
    }),
  ],
  preview: {
    select: { platform: "platform", url: "url" },
    prepare: ({ platform, url }) => ({
      title:
        PODCAST_PLATFORMS.find((option) => option.value === platform)?.title ||
        "Platform",
      subtitle: url,
    }),
  },
});
