import type { Metadata } from "next";

import { markdownPathFor } from "./markdown/negotiation";

// No env reads and only pure imports: `./seo-robots.test.mts` loads this with Node's type stripper.

const NON_INDEXABLE_DEPLOYMENTS = ["preview", "development"];

// `IS_INDEXABLE="false"` blocks production too; Vercel previews are never indexable; set
// `IS_INDEXABLE="true"` on non-Vercel hosts, where unset means noindex.
export const resolveIsIndexable = ({
  isIndexableFlag,
  deploymentEnv,
}: {
  isIndexableFlag?: string | null;
  deploymentEnv?: string | null;
}): boolean => {
  const flag = isIndexableFlag?.trim().toLowerCase();

  if (flag === "false") return false;
  if (deploymentEnv && NON_INDEXABLE_DEPLOYMENTS.includes(deploymentEnv)) return false;
  if (flag === "true") return true;

  return deploymentEnv === "production";
};

export interface SeoDirectivesInput {
  canonical?: string | null;
  noIndex?: boolean | null;
  noFollow?: boolean | null;
  hreflang?: ({ hreflang?: string | null; href?: string | null } | null)[] | null;
}

export const markdownAlternateFor = (pageUrl: string): string | undefined => {
  try {
    const url = new URL(pageUrl);
    url.pathname = markdownPathFor(url.pathname);
    url.search = "";
    url.hash = "";

    return url.toString();
  } catch {
    return undefined;
  }
};

// Every page-level metadata builder must spread this: setting `robots` by hand bypasses
// `IS_INDEXABLE`. No Markdown alternate when the canonical points elsewhere (a duplicate).
export const buildRobotsAndAlternates = (
  metadata: SeoDirectivesInput | null | undefined,
  resolvedUrl: string | undefined,
  { isIndexable }: { isIndexable: boolean },
): Pick<Metadata, "robots" | "alternates"> => {
  const languages = (metadata?.hreflang ?? []).reduce<Record<string, string>>(
    (accumulator, entry) => {
      const code = entry?.hreflang?.trim();
      const href = entry?.href?.trim();
      if (code && href) accumulator[code] = href;
      return accumulator;
    },
    {},
  );

  const noIndex = !isIndexable || Boolean(metadata?.noIndex);
  const noFollow = !isIndexable || Boolean(metadata?.noFollow);
  const customCanonical = metadata?.canonical?.trim();
  const canonical = customCanonical || resolvedUrl;
  const markdownUrl =
    resolvedUrl && (!customCanonical || customCanonical === resolvedUrl)
      ? markdownAlternateFor(resolvedUrl)
      : undefined;

  return {
    robots: {
      index: noIndex ? false : undefined,
      follow: noFollow ? false : undefined,
    },
    alternates: {
      ...(canonical ? { canonical } : {}),
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
      ...(markdownUrl ? { types: { "text/markdown": markdownUrl } } : {}),
    },
  };
};
