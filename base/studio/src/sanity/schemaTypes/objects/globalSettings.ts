import { defineField } from "sanity";

export const GLOBAL_SETTING_FIELD_NAME = "globalSetting";

export default defineField({
  name: GLOBAL_SETTING_FIELD_NAME,
  type: "boolean",
  initialValue: true,
  hidden: true,
});
