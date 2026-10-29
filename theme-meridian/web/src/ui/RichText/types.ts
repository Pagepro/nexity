import { type PortableTextBlock } from "sanity";

import { CTAFragment, ImageFragment } from "@/types/fragments";

export interface MyPortableTextProps {
  value: PortableTextBlock[];
  className?: HTMLElement["className"];
}

export interface RichTextImageProps {
  value: ImageFragment;
}

export interface PullquoteValue {
  quote?: string;
  author?: string;
  role?: string;
  avatar?: ImageFragment;
}

export interface CalloutValue {
  content?: PortableTextBlock[];
  cta?: CTAFragment;
  backgroundImage?: ImageFragment;
}

export interface CodeValue {
  code?: string;
  language?: string;
  filename?: string;
}

export interface TableRow {
  _key: string;
  cells?: string[];
}

export interface TableValue {
  rows?: TableRow[];
}

export interface VideoValue {
  url?: string;
  poster?: ImageFragment;
  caption?: string;
}

export interface ChecklistItem {
  _key: string;
  tone?: "do" | "dont";
  title?: string;
  description?: string;
}

export interface ChecklistValue {
  items?: ChecklistItem[];
}

export interface LinkPreview {
  title?: string | null;
  description?: string | null;
  image?: ImageFragment | null;
}
