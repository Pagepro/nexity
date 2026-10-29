// No imports: the `.test.mts` runner loads this without the `@/` alias or Sanity.

export const normalizePathname = (path: string): string => {
  const pathname = path.split(/[?#]/)[0] || "/";

  return pathname.replace(/\/+$/, "") || "/";
};

export const isSelfOrDescendant = (linkPath: string, pathname: string): boolean => {
  if (linkPath === pathname) return true;
  if (linkPath === "/") return false;

  return pathname.startsWith(`${linkPath}/`);
};

export const findActivePath = (
  linkPaths: readonly (string | null)[],
  pathname: string,
): string | null => {
  const current = normalizePathname(pathname);

  return linkPaths.reduce<string | null>((best, linkPath) => {
    if (!linkPath || !isSelfOrDescendant(linkPath, current)) return best;

    return !best || linkPath.length > best.length ? linkPath : best;
  }, null);
};
