import {
  MdFormatAlignCenter,
  MdFormatAlignLeft,
  MdFormatAlignRight,
  MdSuperscript,
  MdSubscript,
} from "react-icons/md";
import { RxFontStyle } from "react-icons/rx";

import {
  Light,
  Subscript,
  Superscript,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
} from "./components";

export const COMMON_DECORATORS = [
  { title: "Strong", value: "strong" },
  {
    title: "Light",
    value: "light",
    icon: RxFontStyle,
    component: Light,
  },
  { title: "Emphasis", value: "em" },
  { title: "Underline", value: "underline" },
  { title: "Strike", value: "strike-through" },
  {
    title: "Subscript",
    value: "sub",
    icon: MdSubscript,
    component: Subscript,
  },
  {
    title: "Superscript",
    value: "sup",
    icon: MdSuperscript,
    component: Superscript,
  },
];

export const ALIGNMENT_DECORATORS = [
  {
    title: "Text left",
    value: "left",
    component: TextAlignLeft,
    icon: MdFormatAlignLeft,
  },
  {
    title: "Text center",
    value: "center",
    component: TextAlignCenter,
    icon: MdFormatAlignCenter,
  },
  {
    title: "Text right",
    value: "right",
    component: TextAlignRight,
    icon: MdFormatAlignRight,
  },
];
