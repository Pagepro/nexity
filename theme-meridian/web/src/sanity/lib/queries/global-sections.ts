import { defineQuery } from "groq";

import { fetchSanity } from "@/sanity/lib/fetch";
import { SECTIONS_QUERY } from "@/sanity/lib/queries";
import { SANITY_TAGS } from "@/sanity/lib/tags";
import type {
  GLOBAL_AFTER_QUERY_RESULT,
  GLOBAL_BEFORE_QUERY_RESULT,
} from "@/types/sanity.types";

import { appliesToSlug, isWildcard } from "./global-section-match";

// Two reads because each inlines SECTIONS_QUERY once (Sanity's 300 KB query-size limit).
export const GLOBAL_BEFORE_QUERY = defineQuery(`*[_type == 'global-section']{
    path,
    excludePaths,
    'sections': before[]{ ${SECTIONS_QUERY} }
  }`);

export const GLOBAL_AFTER_QUERY = defineQuery(`*[_type == 'global-section']{
    path,
    excludePaths,
    'sections': after[]{ ${SECTIONS_QUERY} }
  }`);

type GlobalBeforeSection = NonNullable<
  NonNullable<GLOBAL_BEFORE_QUERY_RESULT[number]["sections"]>[number]
>;
type GlobalAfterSection = NonNullable<
  NonNullable<GLOBAL_AFTER_QUERY_RESULT[number]["sections"]>[number]
>;

/** `slug` must be the FULL url path (e.g. "case-studies/foo", "blog/bar", "/"). */
export async function fetchGlobalSections(
  slug: string,
  fetcher: typeof fetchSanity = fetchSanity,
): Promise<{
  before: GlobalBeforeSection[];
  after: GlobalAfterSection[];
}> {
  const [beforeResult, afterResult] = await Promise.all([
    fetcher<GLOBAL_BEFORE_QUERY_RESULT>({
      query: GLOBAL_BEFORE_QUERY,
      tags: [SANITY_TAGS["global-section"]],
    }),
    fetcher<GLOBAL_AFTER_QUERY_RESULT>({
      query: GLOBAL_AFTER_QUERY,
      tags: [SANITY_TAGS["global-section"]],
    }),
  ]);

  const beforeDocs = (beforeResult ?? [])
    .filter((doc) => appliesToSlug(slug, doc))
    .sort((a, b) => Number(isWildcard(b)) - Number(isWildcard(a)));
  const afterDocs = (afterResult ?? [])
    .filter((doc) => appliesToSlug(slug, doc))
    .sort((a, b) => Number(isWildcard(a)) - Number(isWildcard(b)));

  const before = beforeDocs
    .flatMap((doc) => doc.sections ?? [])
    .filter((section): section is GlobalBeforeSection => section !== null);
  const after = afterDocs
    .flatMap((doc) => doc.sections ?? [])
    .filter((section): section is GlobalAfterSection => section !== null);

  return { before, after };
}
