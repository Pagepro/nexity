import { stegaClean } from "next-sanity";

import resolveUrl from "@/lib/resolveUrl";
import { LinkFragment } from "@/types/fragments";

import { HeaderMenuLinkItems, MenuProps } from "../types";

import { findActivePath, normalizePathname } from "./active-path";

type MenuLink = Omit<LinkFragment, "_type">;

export interface ActiveNav {
  path: string | null;
  isExact: boolean;
}

const linkPathname = (link: MenuLink): string | null => {
  const { type, internal, internalPath, params } = link;
  const cleanType = stegaClean(type);

  if (cleanType === "path" && internalPath) {
    return normalizePathname(stegaClean(internalPath));
  }

  if (cleanType === "internal" && internal) {
    return normalizePathname(resolveUrl(internal, { base: false, params }));
  }

  return null;
};

const dropdownLinks = (items: HeaderMenuLinkItems): MenuLink[] =>
  items?.flatMap((item): MenuLink[] => {
    if (item._type === "link") return [item];

    if (item._type === "link.list") {
      return [
        ...(item.link ? [item.link] : []),
        ...(item.links?.flatMap((linkItem): MenuLink[] => {
          if (linkItem._type === "link") return [linkItem];
          if (linkItem._type === "link.list") {
            return [
              ...(linkItem.link ? [linkItem.link] : []),
              ...(linkItem.links?.filter((nested) => nested._type === "link") ?? []),
            ];
          }

          return [];
        }) ?? []),
      ];
    }

    return [];
  }) ?? [];

export const getActiveNav = (menu: MenuProps["menu"], pathname: string): ActiveNav => {
  const linkPaths = (menu ?? []).flatMap((item) => {
    if (item._type === "headerLink") return [linkPathname(item)];
    if (item._type === "headerLink.list")
      return dropdownLinks(item.items).map(linkPathname);

    return [];
  });
  const path = findActivePath(linkPaths, pathname);

  return { path, isExact: path !== null && path === normalizePathname(pathname) };
};

export type AriaCurrent = "page" | "true";

export const linkCurrent = (
  link: MenuLink,
  active: ActiveNav,
): AriaCurrent | undefined => {
  if (active.path === null || linkPathname(link) !== active.path) return undefined;

  return active.isExact ? "page" : "true";
};

export const hasActiveMenuItem = (
  items: HeaderMenuLinkItems,
  active: ActiveNav,
): boolean =>
  active.path !== null &&
  dropdownLinks(items).some((link) => linkPathname(link) === active.path);
