export interface GlobalSectionScope {
  path: string | null;
  excludePaths: (string | null)[] | null;
}

// Matched here, not in GROQ: a `$slug` filter made every route send its own ~200 KB
// query pair, where one cached read now serves them all.
export const appliesToSlug = (
  slug: string,
  { path, excludePaths }: GlobalSectionScope,
): boolean =>
  typeof path === "string" &&
  (path === "*" || slug.startsWith(path)) &&
  !(excludePaths ?? []).some(
    (excluded) => typeof excluded === "string" && slug.startsWith(excluded),
  );

export const isWildcard = ({ path }: GlobalSectionScope): boolean => path === "*";
