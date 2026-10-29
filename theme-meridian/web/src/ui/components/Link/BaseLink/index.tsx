import { stegaClean } from "next-sanity";
import NextLink, { LinkProps } from "next/link";

import resolveUrl from "@/lib/resolveUrl";

import { BaseLinkProps } from "./types";
import { internalPathHref, isSanityLink, opensInNewTab } from "./utils";

export const BaseLink: React.FC<BaseLinkProps> = ({
  link,
  openInNewTab,
  children,
  ...rest
}) => {
  if (isSanityLink(link)) {
    if (link?.type === "internal" && link.internal)
      return (
        <NextLink
          href={resolveUrl(link.internal, {
            base: false,
            params: link.params || undefined,
          })}
          {...rest}
        >
          {children}
        </NextLink>
      );

    if (link?.type === "path" && link.internalPath) {
      const href = internalPathHref(
        stegaClean(link.internalPath),
        link.params ? stegaClean(link.params) : undefined,
      );

      if (href)
        return (
          <NextLink href={href} {...rest}>
            {children}
          </NextLink>
        );
    }

    if (link?.type === "external" && link.external) {
      const href = stegaClean(link.external);
      const isNewTab = openInNewTab ?? opensInNewTab(href);

      return (
        <a
          href={href}
          target={isNewTab ? "_blank" : undefined}
          rel={rest.rel || "noopener noreferrer"}
          {...rest}
        >
          {children}
        </a>
      );
    }

    if (link?.type === "download" && link.file?.asset?.url) {
      return (
        <a
          href={link.file.asset?.url}
          download={link.file.asset?.label || link.file.asset?.originalFilename}
          rel={rest.rel || "noopener noreferrer"}
          {...rest}
        >
          {children}
        </a>
      );
    }

    return children;
  }

  const plainHref = typeof link === "string" ? link : "";
  const isNewTab = openInNewTab ?? opensInNewTab(plainHref);

  return (
    <NextLink
      href={link as LinkProps["href"]}
      target={isNewTab ? "_blank" : undefined}
      rel={isNewTab ? "noopener noreferrer" : undefined}
      {...rest}
    >
      {children}
    </NextLink>
  );
};
