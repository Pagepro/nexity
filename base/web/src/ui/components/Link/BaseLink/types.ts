import { LinkProps } from "next/link";

import { LinkFragment } from "@/types/fragments";

export interface BaseLinkProps
  extends
    Omit<LinkProps, "href">,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> {
  link: Omit<LinkFragment, "_type" | "label"> | LinkProps["href"];
  openInNewTab?: boolean;
}
