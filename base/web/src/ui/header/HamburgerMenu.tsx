"use client";

import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { FC, useState } from "react";

import { BaseLink } from "@/ui/components/Link/BaseLink";

import HeaderLink from "./HeaderLink";
import { useHeader } from "./hooks";
import Toggle from "./Toggle";
import { HamburgerMenuProps, HeaderMenu, HeaderMenuLinkList } from "./types";
import { getActiveNav, hasActiveMenuItem, linkCurrent } from "./utils/activeLinkUtils";

const ROW =
  "flex h-10 w-full items-center justify-between rounded-md px-3 text-14 font-medium text-foreground transition-colors";

const HamburgerMenu: FC<HamburgerMenuProps> = ({ menu, ctaSlot }) => {
  const pathname = usePathname();
  // Keyed by pathname, so navigating to another page collapses every section.
  const [expanded, setExpanded] = useState<{
    pathname: string | null;
    sections: Record<string, boolean>;
  }>({ pathname, sections: {} });
  const expandedSections = expanded.pathname === pathname ? expanded.sections : {};
  const activeNav = getActiveNav(menu, pathname || "");
  const { wrapperRef, handleClickOutside, closeMenu } = useHeader();

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [handleClickOutside]);

  if (!menu?.length) return null;

  const toggleSection = (key: string) => {
    setExpanded({
      pathname,
      sections: { ...expandedSections, [key]: !expandedSections[key] },
    });
  };

  const handleScrimClose = () => {
    closeMenu();
    setExpanded({ pathname, sections: {} });
  };

  const renderAccordionSection = (item: HeaderMenuLinkList) => {
    const isExpanded = expandedSections[item._key] || false;
    const hasActivePage = hasActiveMenuItem(item.items, activeNav);

    return (
      <div key={item._key}>
        <button
          type="button"
          onClick={() => toggleSection(item._key)}
          aria-expanded={isExpanded}
          className={clsx(
            ROW,
            isExpanded || hasActivePage ? "bg-accent" : "hover:bg-accent/60",
          )}
        >
          {item.title}
          <ChevronRight
            className={clsx(
              "size-4 shrink-0 transition-transform duration-200",
              isExpanded && "rotate-90",
            )}
          />
        </button>
        {isExpanded && item.items?.length && (
          <div className="flex flex-col">
            {item.items.map((subItem) => {
              if (subItem._type === "link") {
                return (
                  <HeaderLink
                    key={subItem._key}
                    type={subItem.type}
                    label={subItem.label}
                    internal={subItem.internal}
                    internalPath={subItem.internalPath}
                    external={subItem.external}
                    params={subItem.params}
                    file={subItem.file}
                    current={linkCurrent(subItem, activeNav)}
                    className="flex h-10 items-center rounded-md pr-3 pl-5 text-14 font-medium text-foreground transition-colors hover:bg-accent/60"
                  />
                );
              }

              if (subItem._type === "link.list") {
                return (
                  <div key={subItem._key} className="flex flex-col">
                    {subItem.withTitle && subItem.title && (
                      <span className="flex h-10 items-center px-5 text-14 font-semibold text-foreground/60">
                        {subItem.title}
                      </span>
                    )}
                    {!subItem.withTitle && subItem.link && (
                      <BaseLink
                        link={{
                          type: subItem.link.type,
                          internal: subItem.link.internal,
                          internalPath: subItem.link.internalPath,
                          external: subItem.link.external,
                          params: subItem.link.params,
                          file: subItem.link.file,
                        }}
                        className="flex h-10 items-center rounded-md pr-3 pl-5 text-14 font-medium text-foreground transition-colors hover:bg-accent/60"
                      >
                        {subItem.link.label || subItem.title || ""}
                      </BaseLink>
                    )}
                    {subItem.links?.map((linkItem) => {
                      if (linkItem._type === "link") {
                        return (
                          <HeaderLink
                            key={linkItem._key}
                            type={linkItem.type}
                            label={linkItem.label}
                            internal={linkItem.internal}
                            internalPath={linkItem.internalPath}
                            external={linkItem.external}
                            params={linkItem.params}
                            file={linkItem.file}
                            current={linkCurrent(linkItem, activeNav)}
                            className="flex h-10 items-center rounded-md pr-3 pl-8 text-14 text-foreground/70 transition-colors hover:bg-accent/60"
                          />
                        );
                      }

                      if (linkItem._type === "link.list") {
                        const nestedExpanded = expandedSections[linkItem._key] || false;

                        return (
                          <div key={linkItem._key} className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => toggleSection(linkItem._key)}
                              aria-expanded={nestedExpanded}
                              className={clsx(
                                "flex h-10 items-center justify-between rounded-md pr-3 pl-8 text-14 transition-colors hover:bg-accent/60",
                                nestedExpanded
                                  ? "font-medium text-foreground"
                                  : "text-foreground/70",
                              )}
                            >
                              {linkItem.title || linkItem.link?.label || ""}
                              <ChevronRight
                                className={clsx(
                                  "size-3.5 shrink-0 transition-transform duration-200",
                                  nestedExpanded && "rotate-90",
                                )}
                              />
                            </button>
                            {nestedExpanded && linkItem.links?.length && (
                              <div className="flex flex-col">
                                {linkItem.links.map((nestedLink) => {
                                  if (nestedLink._type === "link") {
                                    return (
                                      <HeaderLink
                                        key={nestedLink._key}
                                        type={nestedLink.type}
                                        label={nestedLink.label}
                                        internal={nestedLink.internal}
                                        internalPath={nestedLink.internalPath}
                                        external={nestedLink.external}
                                        params={nestedLink.params}
                                        file={nestedLink.file}
                                        current={linkCurrent(nestedLink, activeNav)}
                                        className="flex h-10 items-center rounded-md pr-3 pl-12 text-14 text-foreground/60 transition-colors hover:bg-accent/60"
                                      />
                                    );
                                  }

                                  return null;
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMenuItem = (item: HeaderMenu) => {
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
          className={clsx(ROW, current ? "bg-accent" : "hover:bg-accent/60")}
        >
          {item.label || ""}
        </BaseLink>
      );
    }

    if (item._type === "headerLink.list") {
      return renderAccordionSection(item);
    }

    return null;
  };

  return (
    <div ref={wrapperRef} className="lg:hidden">
      <Toggle onClose={() => setExpanded({ pathname, sections: {} })} />

      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={handleScrimClose}
        className={clsx(
          "pointer-events-none fixed inset-x-0 top-[var(--header-height)] bottom-0 cursor-default bg-foreground/40 opacity-0 backdrop-blur-md transition-opacity duration-300",
          "[.header-open_&]:pointer-events-auto [.header-open_&]:opacity-100",
        )}
      />

      <div className="header-mobile-drawer absolute top-full right-0 left-0 border-b border-border bg-background shadow-lg">
        <div className="min-h-0 overflow-hidden">
          <div className="flex max-h-[calc(100dvh-var(--header-height))] flex-col overflow-y-auto px-2 pt-2 pb-5">
            <div className="flex flex-col gap-1">
              {menu.map((item) => renderMenuItem(item))}
            </div>

            {ctaSlot && (
              <>
                <span className="my-3 h-px w-full bg-border" aria-hidden />
                <div className="flex flex-col items-center gap-3 px-3">{ctaSlot}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HamburgerMenu;
