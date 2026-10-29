"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { FC, useEffect, useRef, useState } from "react";

import { LinkFragment } from "@/types/fragments";
import { BaseLink } from "@/ui/components/Link/BaseLink";

import HeaderLink from "./HeaderLink";
import { useHeader } from "./hooks";
import { NAV_PILL_BASE } from "./Navigation";
import { LinkList, NavigationDropdownProps } from "./types";
import { hasActiveMenuItem, linkCurrent } from "./utils/activeLinkUtils";

const DROPDOWN_ROW =
  "block rounded-md px-2 py-1.5 text-14 font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground";

const DROPDOWN_HEADER = "px-2 pt-1.5 pb-1 text-12 text-muted-foreground";

const NavigationDropdown: FC<NavigationDropdownProps> = ({ items, title, activeNav }) => {
  const pathname = usePathname();
  const hasActiveSubMenuItem = hasActiveMenuItem(items, activeNav);
  const { closeMenu } = useHeader();
  const headerDropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const hasCategories = items?.some((item) => item._type === "link.list");

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      if (
        headerDropdownRef.current &&
        !headerDropdownRef.current.contains(target) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
    closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const renderLink = (link: Omit<LinkFragment, "_type"> & { _key: string }) => {
    const current = linkCurrent(link, activeNav);

    return (
      <HeaderLink
        key={link._key}
        type={link.type}
        label={link.label}
        internal={link.internal}
        internalPath={link.internalPath}
        external={link.external}
        params={link.params}
        file={link.file}
        current={current}
        className={clsx(DROPDOWN_ROW, current && "bg-accent text-foreground")}
      />
    );
  };

  const renderColumn = (list: LinkList) => (
    <div key={list._key} className="flex min-w-0 flex-1 flex-col gap-0.5">
      {list.withTitle && list.title && (
        <span className={DROPDOWN_HEADER}>{list.title}</span>
      )}
      {!list.withTitle && list.link && (
        <BaseLink
          link={{
            type: list.link.type,
            internal: list.link.internal,
            internalPath: list.link.internalPath,
            external: list.link.external,
            params: list.link.params,
            file: list.link.file,
          }}
          className={clsx(DROPDOWN_ROW, "text-foreground")}
        >
          {list.link.label || list.title || ""}
        </BaseLink>
      )}
      {list.links?.map((linkItem) => {
        if (linkItem._type === "link") {
          return renderLink(linkItem);
        }

        if (linkItem._type === "link.list") {
          return (
            <div key={linkItem._key} className="mt-1 flex flex-col gap-0.5">
              {(linkItem.title || linkItem.link?.label) && (
                <span className={DROPDOWN_HEADER}>
                  {linkItem.title || linkItem.link?.label}
                </span>
              )}
              {linkItem.links?.map((nestedLink) =>
                nestedLink._type === "link" ? renderLink(nestedLink) : null,
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );

  return (
    <div
      ref={headerDropdownRef}
      className="relative"
      onMouseEnter={() => {
        closeMenu();
        setIsOpen(true);
      }}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className={clsx(
          NAV_PILL_BASE,
          isOpen || hasActiveSubMenuItem
            ? "bg-button-ghost-hover text-foreground"
            : "text-foreground hover:bg-button-ghost-hover",
        )}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        {title}
        <ChevronDown
          className={clsx(
            "size-3.5 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <div
        className={clsx(
          "absolute top-full left-1/2 z-50 -translate-x-1/2 pt-2 transition-all duration-200 ease-in-out",
          isOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div
          className={clsx(
            "flex gap-2 rounded-lg border border-border bg-background p-2 shadow-lg",
            hasCategories ? "w-max max-w-[min(36rem,90vw)]" : "min-w-[11.25rem] flex-col",
          )}
        >
          {hasCategories
            ? items?.flatMap((item, index) => {
                let column = null;

                if (item._type === "link.list") {
                  column = renderColumn(item);
                } else if (item._type === "link") {
                  column = (
                    <div key={item._key} className="flex min-w-0 flex-1 flex-col">
                      {renderLink(item)}
                    </div>
                  );
                }

                if (!column) return [];

                return index > 0
                  ? [
                      <span
                        key={`${item._key}-divider`}
                        className="w-px self-stretch bg-border"
                        aria-hidden
                      />,
                      column,
                    ]
                  : [column];
              })
            : items?.map((linkItem) =>
                linkItem._type === "link" ? renderLink(linkItem) : null,
              )}
        </div>
      </div>
    </div>
  );
};

export default NavigationDropdown;
