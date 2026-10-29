import { VscSymbolMisc } from "react-icons/vsc";
import { defineField } from "sanity";

import utilityIcons from "@/consts/utility/utility-icons";
import Icon from "@/ui/Icon";

export default defineField({
  name: "buttonIcon",
  title: "Icon",
  icon: VscSymbolMisc,
  type: "object",
  fields: [
    defineField({
      name: "withIcon",
      title: "Show icon?",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "icon",
      type: "icon",
      hidden: ({ parent }) => !parent?.withIcon,
    }),
    defineField({
      name: "iconPlacement",
      title: "Icon placement",
      description: "Where to place the icon",
      type: "string",
      options: {
        list: ["left", "right"],
      },
      initialValue: "left",
      hidden: ({ parent }) => !parent?.withIcon,
    }),
  ],
  preview: {
    select: {
      icon: "icon",
    },
    prepare: ({ icon }) => {
      const selectedIcon = utilityIcons.find((i) => i.value === icon);

      return {
        title: selectedIcon?.name || icon,
        media: icon ? <Icon icon={icon as never} /> : null,
      };
    },
  },
});
