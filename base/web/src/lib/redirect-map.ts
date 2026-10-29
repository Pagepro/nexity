// Keep this module dependency-free (no Next, Sanity or I/O): `redirect-map.test.mts` runs it
// under type stripping. Unsupported source syntax is reported and skipped, never matched
// loosely: a wildcard that swallows too many paths is worse than one that does nothing.

export const REDIRECT_TTL_SECONDS = 4 * 60 * 60;

// The real propagation delay for a new redirect: the webhook purges the server cache, but
// each running instance keeps its own in-memory copy this long.
export const PROXY_MEMO_TTL_MS = 60_000;

// ⚠️ Derived, never a second literal: the `s-maxage` on `/api/redirects` is a CDN layer
// `revalidateTag` cannot purge, so it must not exceed the memo TTL.
export const PROXY_MEMO_CACHE_SECONDS = PROXY_MEMO_TTL_MS / 1000;

export const PROXY_RETRY_MS = 5_000;

const MAX_CHAIN_HOPS = 10;

export interface RedirectEntry {
  source: string | null;
  destination: string | null;
  /** `null` (never set) counts as permanent, the schema's initial value. */
  permanent: boolean | null;
}

export interface RedirectTarget {
  destination: string;
  permanent: boolean;
}

export type RedirectMap = Record<string, RedirectTarget>;

export interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

export interface RedirectTable {
  exact: RedirectMap;
  rules: RedirectRule[];
}

export interface RewriteEntry {
  source: string | null;
  destination: string | null;
}

export interface RewriteRule {
  source: string;
  destination: string;
}

export interface BuiltRewriteRules {
  rewrites: RewriteRule[];
  skipped: { source: string; reason: string }[];
}

export interface CollapsedChain {
  source: string;
  via: string[];
  destination: string;
}

export interface BuiltRedirectTable extends RedirectTable {
  skipped: { source: string; reason: string }[];
  collapsed: CollapsedChain[];
}

const decodeSafely = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

// Requests arrive percent-encoded (`/t%26c`), documents store what the editor typed (`/t&c`),
// so both sides are decoded before they meet.
export const normalizePath = (value: string): string => {
  const pathOnly = String(value ?? "")
    .split("?")[0]
    .split("#")[0];
  const trimmed = decodeSafely(pathOnly).replace(/\/+$/, "");

  return trimmed === "" ? "/" : trimmed;
};

const ABSOLUTE_DESTINATION = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

// ⚠️ A bare slug can be a redirect LOOP: `new URL("about", origin)` gives `/about`, which may
// be the source itself. The leading slash also lets the "points at itself" check see it.
export const normalizeDestination = (value: string): string =>
  !value || ABSOLUTE_DESTINATION.test(value) || value.startsWith("/")
    ? value
    : `/${value}`;

const splitTarget = (value: string) => {
  const [beforeHash, ...hashParts] = value.split("#");
  const [path, ...queryParts] = beforeHash.split("?");

  return { path, query: queryParts.join("?"), hash: hashParts.join("#") };
};

// Must match how `proxy.ts` merges query and hash at request time.
const applyHop = (destination: string, incoming: string): string => {
  const target = splitTarget(destination);
  const origin = splitTarget(incoming);

  const params = new URLSearchParams(target.query);

  for (const [key, value] of new URLSearchParams(origin.query)) {
    if (!params.has(key)) params.append(key, value);
  }

  const query = params.toString();
  const hash = target.hash || origin.hash;

  return `${target.path}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
};

const PARAM_SEGMENT = /^:([A-Za-z_][A-Za-z0-9_]*)([?*+])?$/;

type PatternSegment =
  | { kind: "literal"; value: string }
  | { kind: "param"; name: string; modifier: "" | "?" | "*" | "+" };

const parsePattern = (path: string): PatternSegment[] | null => {
  const segments: PatternSegment[] = [];

  for (const segment of path.split("/").filter(Boolean)) {
    const param = PARAM_SEGMENT.exec(segment);

    if (param) {
      segments.push({
        kind: "param",
        name: param[1],
        modifier: (param[2] ?? "") as "" | "?" | "*" | "+",
      });
      continue;
    }

    if (/[:()*+?]/.test(segment)) return null;

    segments.push({ kind: "literal", value: decodeSafely(segment) });
  }

  return segments;
};

// Captures keep the raw (still-encoded) segments so they can go straight into a `Location`.
const matchSegments = (
  pattern: PatternSegment[],
  requestSegments: string[],
  captures: Record<string, string> = {},
): Record<string, string> | null => {
  if (pattern.length === 0) return requestSegments.length === 0 ? captures : null;

  const [head, ...rest] = pattern;

  if (head.kind === "literal") {
    if (requestSegments.length === 0) return null;
    if (decodeSafely(requestSegments[0]) !== head.value) return null;

    return matchSegments(rest, requestSegments.slice(1), captures);
  }

  const minimum = head.modifier === "?" || head.modifier === "*" ? 0 : 1;
  const maximum =
    head.modifier === "*" || head.modifier === "+" ? requestSegments.length : 1;

  // Greedy first, like path-to-regexp: `/a/:rest*` takes as much as it can.
  for (let taken = Math.min(maximum, requestSegments.length); taken >= minimum; taken--) {
    const result = matchSegments(rest, requestSegments.slice(taken), {
      ...captures,
      [head.name]: requestSegments.slice(0, taken).join("/"),
    });

    if (result) return result;
  }

  return null;
};

const fillDestination = (destination: string, captures: Record<string, string>) =>
  destination.replace(/:([A-Za-z_][A-Za-z0-9_]*)[?*+]?/g, (token, name: string) =>
    // Guard: without it `mailto:x` would be treated as a `:x` parameter.
    Object.hasOwn(captures, name) ? captures[name] : token,
  );

const sourceConditions = (source: string): [string, string][] => {
  const query = source.split("?")[1]?.split("#")[0] ?? "";

  return [...new URLSearchParams(query)];
};

const isPatternSource = (path: string) => /[:*]/.test(path);

const matchRule = (
  rule: Pick<RedirectRule, "source" | "destination">,
  pathname: string,
  searchParams: URLSearchParams,
): string | undefined => {
  for (const [key, value] of sourceConditions(rule.source)) {
    if (!searchParams.has(key)) return undefined;
    if (value && searchParams.get(key) !== value) return undefined;
  }

  const sourcePath = rule.source.split("?")[0];

  if (!isPatternSource(sourcePath)) {
    return normalizePath(pathname) === normalizePath(sourcePath)
      ? rule.destination
      : undefined;
  }

  const pattern = parsePattern(sourcePath);
  if (!pattern) return undefined;

  const captures = matchSegments(pattern, pathname.split("/").filter(Boolean));
  if (!captures) return undefined;

  const filled = fillDestination(rule.destination, captures);
  const { path, query, hash } = splitTarget(filled);
  // An empty `:rest*` would otherwise leave `//` or a trailing slash.
  const tidyPath = path.replace(/(?<!:)\/{2,}/g, "/").replace(/(.)\/+$/, "$1");

  return `${tidyPath}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
};

const followChain = (
  map: RedirectMap,
  source: string,
): { destination: string; via: string[]; permanent: boolean } | null => {
  const seen = new Set([source]);
  const via: string[] = [];

  let current = map[source].destination;
  let permanent = map[source].permanent;

  for (let hop = 0; hop < MAX_CHAIN_HOPS; hop++) {
    if (ABSOLUTE_DESTINATION.test(current))
      return { destination: current, via, permanent };

    const key = normalizePath(current);
    const next = map[key];

    if (!next) return { destination: current, via, permanent };
    if (seen.has(key)) return null;

    seen.add(key);
    via.push(current);
    permanent = permanent && next.permanent;
    current = applyHop(next.destination, current);
  }

  return null;
};

export const buildRedirectMap = (entries: RedirectEntry[]): BuiltRedirectTable => {
  const map: RedirectMap = {};
  const rules: RedirectRule[] = [];
  const skipped: { source: string; reason: string }[] = [];

  for (const entry of entries ?? []) {
    const source = String(entry?.source ?? "").trim();
    const destination = normalizeDestination(String(entry?.destination ?? "").trim());

    if (!source || !destination) continue;

    const permanent = entry?.permanent !== false;

    if (!source.startsWith("/") || source.startsWith("//")) {
      skipped.push({ source, reason: "not a root-relative path" });
      continue;
    }

    const sourcePath = source.split("?")[0];
    const hasConditions = source.includes("?");

    if (isPatternSource(sourcePath) && !parsePattern(sourcePath)) {
      skipped.push({
        source,
        reason: "unsupported pattern syntax (use :name, :name?, :name* or :name+)",
      });
      continue;
    }

    if (isPatternSource(sourcePath) || hasConditions) {
      rules.push({ source, destination, permanent });
      continue;
    }

    const key = normalizePath(source);

    if (key === normalizePath(destination)) {
      skipped.push({ source, reason: "points at itself" });
      continue;
    }
    if (map[key]) {
      skipped.push({ source, reason: "a second document already claims this source" });
      continue;
    }

    map[key] = { destination, permanent };
  }

  // Read from `map`, write into `exact`, or a half-collapsed entry feeds the next walk.
  const collapsed: CollapsedChain[] = [];
  const exact: RedirectMap = {};

  for (const source of Object.keys(map)) {
    const resolved = followChain(map, source);

    if (!resolved) {
      skipped.push({ source, reason: "cyclic or over-long chain" });
      continue;
    }

    exact[source] = { destination: resolved.destination, permanent: resolved.permanent };

    if (resolved.via.length) {
      collapsed.push({ source, via: resolved.via, destination: resolved.destination });
    }
  }

  return { exact, rules, skipped, collapsed };
};

// `undefined` when the onward hop leads back to the request: a loop the build pass cannot see.
const resolveOnward = (
  table: RedirectTable,
  requestPath: string,
  target: RedirectTarget,
): RedirectTarget | undefined => {
  const onward = ABSOLUTE_DESTINATION.test(target.destination)
    ? undefined
    : table.exact[normalizePath(target.destination)];
  const resolved = onward
    ? {
        destination: applyHop(onward.destination, target.destination),
        permanent: target.permanent && onward.permanent,
      }
    : target;

  return normalizePath(resolved.destination) === requestPath &&
    !ABSOLUTE_DESTINATION.test(resolved.destination)
    ? undefined
    : resolved;
};

// Query-conditioned rules go first so `/old?ref=x` can win over a plain `/old`.
export const matchRedirect = (
  table: RedirectTable,
  pathname: string,
  searchParams: URLSearchParams = new URLSearchParams(),
): RedirectTarget | undefined => {
  const requestPath = normalizePath(pathname);
  const conditional = table.rules.filter((rule) => rule.source.includes("?"));
  const patterns = table.rules.filter((rule) => !rule.source.includes("?"));

  const fromRules = (rules: RedirectRule[]) => {
    for (const rule of rules) {
      const destination = matchRule(rule, pathname, searchParams);

      if (destination) {
        const resolved = resolveOnward(table, requestPath, {
          destination,
          permanent: rule.permanent,
        });

        if (resolved) return resolved;
      }
    }

    return undefined;
  };

  return fromRules(conditional) ?? table.exact[requestPath] ?? fromRules(patterns);
};

// Returned pre-sorted most specific first (conditional, exact, pattern), because
// `matchRewrite` is a plain first-match scan.
export const buildRewriteRules = (entries: RewriteEntry[]): BuiltRewriteRules => {
  const conditional: RewriteRule[] = [];
  const exact: RewriteRule[] = [];
  const patterns: RewriteRule[] = [];
  const claimed = new Set<string>();
  const skipped: { source: string; reason: string }[] = [];

  for (const entry of entries ?? []) {
    const source = String(entry?.source ?? "").trim();
    const destination = normalizeDestination(String(entry?.destination ?? "").trim());

    if (!source || !destination) continue;

    if (!source.startsWith("/") || source.startsWith("//")) {
      skipped.push({ source, reason: "not a root-relative path" });
      continue;
    }

    const sourcePath = source.split("?")[0];

    if (isPatternSource(sourcePath) && !parsePattern(sourcePath)) {
      skipped.push({
        source,
        reason: "unsupported pattern syntax (use :name, :name?, :name* or :name+)",
      });
      continue;
    }

    if (source.includes("?")) {
      conditional.push({ source, destination });
      continue;
    }

    if (isPatternSource(sourcePath)) {
      patterns.push({ source, destination });
      continue;
    }

    const key = normalizePath(source);

    if (!ABSOLUTE_DESTINATION.test(destination) && key === normalizePath(destination)) {
      skipped.push({ source, reason: "points at itself" });
      continue;
    }
    if (claimed.has(key)) {
      skipped.push({ source, reason: "a second document already claims this source" });
      continue;
    }

    claimed.add(key);
    exact.push({ source, destination });
  }

  return { rewrites: [...conditional, ...exact, ...patterns], skipped };
};

export const matchRewrite = (
  rewrites: RewriteRule[],
  pathname: string,
  searchParams: URLSearchParams = new URLSearchParams(),
): string | undefined => {
  for (const rule of rewrites) {
    const destination = matchRule(rule, pathname, searchParams);

    if (destination) return destination;
  }

  return undefined;
};
