import type { ExtractSectionProps } from "@/types/sections";

export const contentFixture = {
  _type: "content",
  _key: "gallery-fixture-content",
  content: [
    {
      _type: "block",
      _key: "heading",
      style: "alt-heading-2",
      children: [
        {
          _type: "span",
          _key: "heading-span",
          text: "How it works",
          marks: [],
        },
      ],
    },
    {
      _type: "block",
      _key: "intro",
      style: "alt-body-2",
      children: [
        {
          _type: "span",
          _key: "intro-span",
          text: "Three steps to a live, editable marketing site that your whole team can own.",
          marks: [],
        },
      ],
    },
    {
      _type: "block",
      _key: "item-1",
      style: "normal",
      listItem: "number",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "item-1-span",
          text: "Pick from a library of pre-built, responsive section types.",
          marks: [],
        },
      ],
    },
    {
      _type: "block",
      _key: "item-2",
      style: "normal",
      listItem: "number",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "item-2-span",
          text: "Drop in your copy, imagery, and calls to action.",
          marks: [],
        },
      ],
    },
    {
      _type: "block",
      _key: "item-3",
      style: "normal",
      listItem: "number",
      level: 1,
      children: [
        {
          _type: "span",
          _key: "item-3-span",
          text: "Publish — changes go live without a single deploy.",
          marks: [],
        },
      ],
    },
  ],
} satisfies ExtractSectionProps<"content">;
