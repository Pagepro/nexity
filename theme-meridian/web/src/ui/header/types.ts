import { LinkFragment } from "@/types/fragments";
import { HeaderQueryResult, SiteQueryResult } from "@/types/sanity.types";

import type { ActiveNav, AriaCurrent } from "./utils/activeLinkUtils";

export interface HeaderContentProps {
  title: string | null;
  logo: NonNullable<SiteQueryResult>["logo"];
  ctas: NonNullable<HeaderQueryResult>["ctas"];
  menu: NonNullable<HeaderQueryResult>["menu"];
  searchLink?: NonNullable<HeaderQueryResult>["searchLink"];
}

export interface MenuProps {
  menu: NonNullable<HeaderQueryResult>["menu"];
}

export type HeaderCtaItem = NonNullable<NonNullable<HeaderQueryResult>["ctas"]>[number];

export interface HeaderCtaProps {
  cta: HeaderCtaItem;
  block?: boolean;
}

export interface SearchActionProps {
  searchLink?: NonNullable<HeaderQueryResult>["searchLink"];
  className?: string;
}

export type HeaderMenu = NonNullable<NonNullable<HeaderQueryResult>["menu"]>[number];

export type HeaderMenuLink = Extract<HeaderMenu, { _type: "headerLink" }>;

export type HeaderMenuLinkList = Extract<HeaderMenu, { _type: "headerLink.list" }>;

export type HeaderMenuLinkItems = HeaderMenuLinkList["items"];

export type HeaderMenuLinkItem = NonNullable<HeaderMenuLinkList["items"]>[number];

export type LinkList = Extract<HeaderMenuLinkItem, { _type: "link.list" }>;

export interface HamburgerMenuProps {
  menu: NonNullable<HeaderQueryResult>["menu"];
  /** Server-rendered `<HeaderCta block />`: importing ButtonLink here would add it to first-load JS. */
  ctaSlot?: React.ReactNode;
}

export interface NavigationDropdownProps {
  items: HeaderMenuLinkItems;
  title: string;
  activeNav: ActiveNav;
  summaryClassName?: string;
}

export interface ToggleProps {
  onClose: () => void;
}

export interface HeaderLinkProps extends Omit<LinkFragment, "_type"> {
  current?: AriaCurrent;
  className?: string;
}
