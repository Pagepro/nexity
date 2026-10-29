// Mirrors the `matcher` in web/src/proxy.ts, which Next requires to be a static literal: change both together.
export const RESERVED_PATH_PREFIXES = [
  "/api",
  "/admin",
  "/_next",
  "/favicon.ico",
  "/cdn-sanity",
];

// Raw prefix, not a whole segment: the matcher excludes `/apis` too.
export const validateUnreservedSource = (source: string | undefined): true | string => {
  const reserved = RESERVED_PATH_PREFIXES.find((prefix) =>
    String(source ?? "").startsWith(prefix),
  );

  return reserved
    ? `Paths starting with "${reserved}" are handled by the app itself and cannot be redirected or rewritten.`
    : true;
};
