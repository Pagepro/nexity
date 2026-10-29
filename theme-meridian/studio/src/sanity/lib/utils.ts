import type {
  Divider,
  ListItem,
  ListItemBuilder,
  StructureBuilder,
} from "sanity/structure";

export const group = (
  S: StructureBuilder,
  title: string,
  items: (ListItemBuilder | ListItem | Divider)[],
): ListItemBuilder => S.listItem().title(title).child(S.list().title(title).items(items));

interface PortableTextBlockLike {
  children?: { text?: string }[];
}

export function getPlainText(blocks?: PortableTextBlockLike[] | null, separator = " ↵ ") {
  if (!blocks?.length) return "";

  return blocks
    .map((block) => block.children?.map((span) => span.text ?? "").join("") ?? "")
    .join(separator);
}

export function formatCount(items: readonly unknown[] | null | undefined, noun: string) {
  const total = items?.length ?? 0;

  return `${total} ${total === 1 ? noun : `${noun}s`}`;
}
