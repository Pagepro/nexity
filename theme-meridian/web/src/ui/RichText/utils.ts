import type {
  ReactPortableTextList,
  ReactPortableTextListItem,
} from "@portabletext/react";

const hasText = (child: object): child is { text: string; marks?: string[] } =>
  "text" in child && typeof child.text === "string";

// Mirrors RichTextChecklist's `hasDescriptions`, so both get the same spacing.
export const hasMultilineItems = (list: ReactPortableTextList): boolean =>
  list.children.some((item) =>
    item.children.some((child) => hasText(child) && child.text.includes("\n")),
  );

export const isTitledItem = (item: ReactPortableTextListItem): boolean => {
  const [title, rest] = item.children;

  return (
    !!title &&
    !!rest &&
    hasText(title) &&
    hasText(rest) &&
    !!title.marks?.includes("strong") &&
    !title.text.includes("\n") &&
    /^\s*\n/.test(rest.text)
  );
};
