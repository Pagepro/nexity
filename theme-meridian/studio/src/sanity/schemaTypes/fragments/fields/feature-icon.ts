import { defineField } from "sanity";

import { FEATURE_ICONS } from "@/consts/feature-icons";

// Separate from the utility `icon` object on purpose: extend FEATURE_ICONS rather than adding a third picker.
export const featureIcon = defineField({
  name: "icon",
  title: "Icon",
  description: "Small line icon shown with the item.",
  type: "string",
  options: { list: FEATURE_ICONS.map(({ title, value }) => ({ title, value })) },
});
