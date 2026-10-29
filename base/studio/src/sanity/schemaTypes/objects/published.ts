import { defineField } from "sanity";

export const PUBLISHED_FIELD_NAME = "published";

export default defineField({
  name: PUBLISHED_FIELD_NAME,
  type: "string",
  hidden: true,
});
