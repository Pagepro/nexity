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
