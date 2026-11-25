import { stegaClean } from "@sanity/client/stega";

// Keep `import type`: `utils.test.mts` runs under Node's type stripper, which
// would resolve a plain import at runtime, and `@/types/fragments` isn't resolvable there.
import type { LinkFragment } from "@/types/fragments";

import type { BaseLinkProps } from "./types";

export const isSanityLink = (link: BaseLinkProps["link"]): link is LinkFragment =>
  typeof link !== "string" && "type" in link;

export const internalPathHref = (
  internalPath: string | null | undefined,
  params?: string | null,
): string => {
  const path = internalPath?.trim();

  if (!path) return "";

  return `${path}${params?.trim() ?? ""}`;
};

const NEW_TAB_SCHEMES = ["http:", "https:"];

/** `mailto:` and `tel:` are deliberately excluded: the blank tab would stay behind. */
export const opensInNewTab = (href: string): boolean => {
  try {
    return NEW_TAB_SCHEMES.includes(new URL(href).protocol);
  } catch {
    return false;
  }
};

type LinkTargetFields = {
  type?: string | null;
  internal?: unknown;
  internalPath?: string | null;
  external?: string | null;
  file?: { asset?: { url?: string | null } | null } | null;
};

/**
 * Mirrors `BaseLink`: false for a link Studio left as `{ type }` after its target was
 * cleared, so an optional link or button renders nothing instead of an empty element.
 */
export const hasLinkTarget = (
  link: LinkTargetFields | string | null | undefined,
): boolean => {
  if (typeof link === "string") return !!link;

  switch (stegaClean(link?.type)) {
    case "internal":
      return !!link?.internal;
    case "path":
      return !!stegaClean(link?.internalPath)?.trim();
    case "external":
      return !!stegaClean(link?.external)?.trim();
    case "download":
      return !!link?.file?.asset?.url;
    default:
      return false;
  }
};
