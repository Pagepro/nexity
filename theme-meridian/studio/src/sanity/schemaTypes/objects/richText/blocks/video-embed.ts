import { VscPlayCircle } from "react-icons/vsc";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "videoEmbed",
  title: "Video embed",
  icon: VscPlayCircle,
  type: "object",
  description: "A poster image with a play button that loads an embedded video on click.",
  fields: [
    defineField({
      name: "url",
      title: "Video URL",
      description: "Full URL of the video to embed (YouTube, Vimeo, or a direct file).",
      type: "url",
      validation: (Rule) =>
        Rule.required()
          .uri({ scheme: ["http", "https"] })
          .error("A video embed needs a valid URL."),
    }),
    defineField({
      name: "poster",
      title: "Poster image",
      description:
        "Thumbnail shown before playback. Aspect ratio 16:9, recommended 1280×720px (landscape).",
      type: "img",
    }),
    defineField({
      name: "caption",
      title: "Caption",
      description: "Optional caption shown beneath the video.",
      type: "string",
    }),
  ],
  preview: {
    select: { caption: "caption", url: "url", media: "poster.image" },
    prepare: ({ caption, url, media }) => ({
      title: caption || "Video embed",
      subtitle: url,
      media,
    }),
  },
});
