import React from "react";

const RawTextRenderer = ({
  children,
  value,
  ..._props
}: {
  children: React.ReactNode;
  value: string;
}) => <div className={value}>{children}</div>;

export default RawTextRenderer;

export const HEADING_STYLES = [
  { title: "Heading 1 (54px)", value: "heading-1", component: RawTextRenderer },
  { title: "Heading 2 (46px)", value: "heading-2", component: RawTextRenderer },
  { title: "Heading 3 (40px)", value: "heading-3", component: RawTextRenderer },
  { title: "Heading 4 (32px)", value: "heading-4", component: RawTextRenderer },
  { title: "Heading 5 (24px)", value: "heading-5", component: RawTextRenderer },
  { title: "Heading 6 (18px)", value: "heading-6", component: RawTextRenderer },
];

export const SECTION_HEADING_STYLES = [
  {
    title: "Section Heading XL (44px)",
    value: "section-heading-xl",
    component: RawTextRenderer,
  },
  {
    title: "Section Heading L (36px)",
    value: "section-heading-lg",
    component: RawTextRenderer,
  },
  {
    title: "Section Heading M (24px)",
    value: "section-heading-md",
    component: RawTextRenderer,
  },
  {
    title: "Section Heading S (20px)",
    value: "section-heading-sm",
    component: RawTextRenderer,
  },
];

export const PARAGRAPH_STYLES = [
  { title: "Text Large (20px)", value: "body-1", component: RawTextRenderer },
  { title: "Text Medium (18px)", value: "body-2", component: RawTextRenderer },
  { title: "Text Normal (16px)", value: "body-3", component: RawTextRenderer },
  { title: "Text Small (14px)", value: "body-4", component: RawTextRenderer },
  { title: "Text Tiny (12px)", value: "body-5", component: RawTextRenderer },
];

export const ALT_HEADING_STYLES = [
  { title: "Heading XXL", value: "alt-heading-1", component: RawTextRenderer },
  { title: "Heading XL", value: "alt-heading-2", component: RawTextRenderer },
  { title: "Heading L", value: "alt-heading-3", component: RawTextRenderer },
  { title: "Heading M", value: "alt-heading-4", component: RawTextRenderer },
  { title: "Heading S", value: "alt-heading-5", component: RawTextRenderer },
  { title: "Heading XS", value: "alt-heading-6", component: RawTextRenderer },
];

export const ALT_PARAGRAPH_STYLES = [
  { title: "Text XXL", value: "alt-body-1", component: RawTextRenderer },
  { title: "Text XL", value: "alt-body-2", component: RawTextRenderer },
  { title: "Text L", value: "alt-body-3", component: RawTextRenderer },
  { title: "Text M", value: "alt-body-4", component: RawTextRenderer },
  { title: "Text S", value: "alt-body-5", component: RawTextRenderer },
  { title: "Text XS", value: "alt-body-6", component: RawTextRenderer },
];
