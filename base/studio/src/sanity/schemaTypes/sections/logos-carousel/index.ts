import { ImagesIcon } from "@sanity/icons/Images";
import { defineField, defineType } from "sanity";

import { formatCount } from "@/sanity/lib/utils";

import { SpeedSlider } from "./SpeedSlider";

export default defineType({
  name: "logos-carousel",
  title: "Logos carousel",
  icon: ImagesIcon,
  type: "object",
  groups: [{ name: "content", default: true }, { name: "options" }],
  fields: [
    defineField({
      name: "options",
      title: "Section options",
      type: "section-options",
      group: "options",
    }),
    defineField({
      name: "logos",
      title: "Logos",
      description:
        "Partner / customer logos. Each is rendered monochrome at 24px height with auto width — use a transparent PNG or SVG. Recommended ~120×24px (landscape); other aspect ratios scale by height.",
      type: "array",
      of: [{ type: "img" }],
      validation: (Rule) =>
        Rule.min(4).warning("Add at least 4 logos so the marquee loops smoothly."),
      group: "content",
    }),
    defineField({
      name: "speed",
      title: "Scroll speed",
      description: "How fast the logos scroll — drag from 1 (slowest) to 5 (fastest).",
      type: "number",
      initialValue: 2,
      validation: (Rule) => Rule.min(1).max(5).integer(),
      components: { input: SpeedSlider },
      group: "content",
    }),
  ],
  preview: {
    select: {
      logos: "logos",
      media: "logos.0.image",
    },
    prepare: ({ logos, media }) => ({
      title: "Logos carousel",
      subtitle: logos?.length ? formatCount(logos, "logo") : "No logos yet",
      media,
    }),
  },
});
