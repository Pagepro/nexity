import { type PortableTextTextBlock } from "sanity";

export const blockContentPreview = (
  value: PortableTextTextBlock[] | string,
  defaultMessage = "No content",
) => {
  if (typeof value === "string") {
    return value;
  }

  const block = (value || []).find(({ _type }) => _type === "block");

  if (!block || block.children?.length === 0) {
    return defaultMessage;
  }

  return (
    block.children
      .filter(({ _type }) => _type === "span")
      .map(({ text }) => text)
      .join("") || defaultMessage
  );
};
