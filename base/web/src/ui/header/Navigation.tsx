"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";

import { BaseLink } from "@/ui/components/Link/BaseLink";

import NavigationDropdown from "./NavigationDropdown";
import { MenuProps } from "./types";
import { getActiveNav, linkCurrent } from "./utils/activeLinkUtils";

export const NAV_PILL_BASE =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-14 font-medium transition-colors";

const Navigation: React.FC<MenuProps> = ({ menu }) => {
  const pathname = usePathname();

  if (!menu?.length) return null;

  const activeNav = getActiveNav(menu, pathname || "");

  return (
    <nav className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 lg:flex">
      {menu.map((item) => {
        if (item._type === "headerLink") {
          const current = linkCurrent(item, activeNav);

          return (
            <BaseLink
              key={item._key}
              link={{
                type: item.type,
                internal: item.internal,
                internalPath: item.internalPath,
                external: item.external,
                params: item.params,
                file: item.file,
              }}
              aria-current={current}
              className={clsx(
                NAV_PILL_BASE,
                current
                  ? "bg-button-ghost-hover text-foreground"
                  : "text-foreground hover:bg-button-ghost-hover",
              )}
            >
              {item.label || ""}
            </BaseLink>
          );
        }

        if (item._type === "headerLink.list") {
          return (
            <NavigationDropdown
              key={item._key}
              title={item.title || ""}
              items={item.items}
              activeNav={activeNav}
            />
          );
        }

        return null;
      })}
    </nav>
  );
};

export default Navigation;
