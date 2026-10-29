// Mirrors the starter's routing: KEEP IN SYNC with web/src/lib/resolveUrl.ts, web/src/app/sitemap.ts
// and the catch-all page route, which matches `metadata.slug.current` without a leading slash.

/** Types the `internal` reference field accepts (partials/linkBaseSchema.ts `to`). */
export const REFERENCEABLE_TYPES = [
  "page",
  "blog-listing-page",
  "case-studies-listing-page",
  "case-study",
  "post",
  "podcast-listing-page",
  "podcast-episode",
];

const PREFIXED_TYPES = {
  post: "/blog/",
  "case-study": "/case-studies/",
  "podcast-episode": "/podcast/",
};

const FIXED_PATH_TYPES = {
  "blog-listing-page": "/blog",
  "case-studies-listing-page": "/case-studies",
  "podcast-listing-page": "/podcast",
};

const CODE_ROUTES = [
  "/llms.txt",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon.png",
  "/icon.svg",
  "/apple-icon.png",
];
const CODE_ROUTE_PREFIXES = ["/admin", "/styleguide", "/api/", "/cdn-sanity/", "/_next/"];

const SKIPPED_STRING_KEYS = new Set(["text", "_type", "_key", "_ref", "_id", "_rev", "_weak"]);

export const LINK_OBJECT_TYPES = new Set(["link", "simpleLink", "headerLink", "iconLink"]);
const LINK_FIELD_KEYS = new Set(["type", "external", "internalPath", "params"]);

export const RULES = ["own-domain", "http", "slash"];

const stripWww = (host) => host.toLowerCase().replace(/^www\./, "");

export const buildOwnHosts = (values) => {
  const hosts = new Set();

  for (const value of values) {
    if (!value) continue;
    const trimmed = String(value).trim();
    if (!trimmed) continue;
    let host;
    try {
      host = new URL(/^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).hostname;
    } catch {
      continue;
    }
    if (host === "localhost" || host === "127.0.0.1") continue;
    hosts.add(stripWww(host));
  }

  return hosts;
};

export const isLocalHost = (host) =>
  /^(localhost|.+\.localhost|.+\.local|.+\.test|.+\.internal)$/i.test(host) ||
  /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
  host.startsWith("[");

const toRouteKey = (pathname) => {
  let path = pathname || "/";
  try {
    path = decodeURI(path);
  } catch {
    // keep the encoded form
  }
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;
};

const hostOf = (value) => {
  const trimmed = value.trim();
  try {
    return new URL(trimmed.startsWith("//") ? `https:${trimmed}` : trimmed).hostname;
  } catch {
    return null;
  }
};

/** Query and hash stay verbatim in `params`, as the link's `params` field expects. */
export const parseOwnUrl = (value, ownHosts) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^(https?:)?\/\//i.test(trimmed)) return null;

  let url;
  try {
    url = new URL(trimmed.startsWith("//") ? `https:${trimmed}` : trimmed);
  } catch {
    return null;
  }
  if (!ownHosts.has(stripWww(url.hostname))) return null;

  return { path: toRouteKey(url.pathname), params: `${url.search}${url.hash}` };
};

/** A site path typed into an `external` field (`/pricing`): the Studio rejects it, imports don't. */
export const parseSitePath = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || /\s/.test(trimmed)) return null;

  const cut = trimmed.search(/[?#]/);
  const pathname = cut === -1 ? trimmed : trimmed.slice(0, cut);

  return { path: toRouteKey(pathname), params: cut === -1 ? "" : trimmed.slice(cut) };
};

export const upgradeHttp = (value) =>
  typeof value === "string" && /^http:\/\//i.test(value.trim())
    ? `https://${value.trim().slice("http://".length)}`
    : null;

/** Next.js `trailingSlash: true` = "always"; unset or false = "never". */
export const detectTrailingSlash = (configSource) =>
  /\btrailingSlash\s*:\s*true\b/.test(configSource ?? "") ? "always" : "never";

// Next's trailing-slash redirect leaves paths whose last segment has a file extension alone.
const hasFileExtension = (path) => /\.[a-z0-9]+$/i.test(path.split("/").pop() ?? "");

export const applyTrailingSlash = (path, convention) => {
  const bare = path.replace(/\/+$/, "");
  if (!bare) return "/";
  return convention === "always" && !hasFileExtension(bare) ? `${bare}/` : bare;
};

const issue = (name, fixable = true) => ({ name, fixable });

export const checkInternalPath = (value, convention) => {
  const issues = [];
  const trimmed = value.trim();
  if (trimmed !== value) issues.push(issue("whitespace"));

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed))
    return { issues: [issue("full URL in a path field", false)], fixed: null };
  if (trimmed.startsWith("//"))
    return { issues: [issue("protocol-relative URL in a path field", false)], fixed: null };
  if (/\s/.test(trimmed)) return { issues: [...issues, issue("space inside the path", false)], fixed: null };
  if (/^[?#]/.test(trimmed)) return { issues: [issue("query or anchor without a path", false)], fixed: null };

  const cut = trimmed.search(/[?#]/);
  let path = cut === -1 ? trimmed : trimmed.slice(0, cut);
  const suffix = cut === -1 ? "" : trimmed.slice(cut);

  if (!path.startsWith("/")) {
    issues.push(issue("missing leading slash"));
    path = `/${path}`;
  }
  if (/\/{2,}/.test(path)) {
    issues.push(issue("double slash"));
    path = path.replace(/\/{2,}/g, "/");
  }
  const conventional = applyTrailingSlash(path, convention);
  if (conventional !== path) {
    issues.push(issue("trailing slash"));
    path = conventional;
  }

  return { issues, fixed: issues.length ? `${path}${suffix}` : value };
};

const ABSOLUTE_URL = /^((?:https?:)?\/\/[^/?#]+)([^?#]*)(.*)$/i;

/** The site root (`https://example.com` or `…/`) is never flagged; the origin text stays verbatim. */
export const checkAbsoluteUrl = (value, convention) => {
  const trimmed = value.trim();
  const match = ABSOLUTE_URL.exec(trimmed);
  if (!match || /\s/.test(trimmed)) return { issues: [], fixed: value };

  const [, origin, rawPath, suffix] = match;
  if (rawPath === "" || rawPath === "/") return { issues: [], fixed: value };

  const issues = [];
  let path = rawPath;
  if (/\/{2,}/.test(path)) {
    issues.push(issue("double slash"));
    path = path.replace(/\/{2,}/g, "/");
  }
  const conventional = applyTrailingSlash(path, convention);
  if (conventional !== path) {
    issues.push(issue("trailing slash"));
    path = conventional;
  }

  return { issues, fixed: issues.length ? `${origin}${path}${suffix}` : value };
};

/**
 * Page slugs are full paths without the leading slash (`/` = home); prefixed types are one
 * segment. A slug with a slash at either end is unreachable, so fixing it changes no live URL;
 * case and whitespace would, so those are report-only.
 */
export const checkSlug = (type, slug) => {
  if (typeof slug !== "string" || (type === "page" && slug === "/")) return { issues: [], fixed: slug };

  const issues = [];
  let fixed = slug;

  if (/^\/+/.test(fixed)) {
    issues.push(issue("leading slash"));
    fixed = fixed.replace(/^\/+/, "");
  }
  if (/\/+$/.test(fixed)) {
    issues.push(issue("trailing slash"));
    fixed = fixed.replace(/\/+$/, "");
  }
  if (/\/{2,}/.test(fixed)) {
    issues.push(issue("double slash"));
    fixed = fixed.replace(/\/{2,}/g, "/");
  }
  if (PREFIXED_TYPES[type] && fixed.includes("/")) issues.push(issue("slash inside a one-segment slug", false));
  if (/\s/.test(fixed)) issues.push(issue("whitespace (changes the URL: add a redirect)", false));
  if (/[A-Z]/.test(fixed)) issues.push(issue("uppercase (changes the URL: add a redirect)", false));
  if (!fixed) issues.push(issue("empty after the fix", false));

  return { issues, fixed };
};

const ensureLeadingSlash = (value) => (value.startsWith("/") ? value : `/${value}`);

export const documentPath = (document) => {
  const type = document._type;
  const slug = document.metadata?.slug?.current?.trim();

  if (FIXED_PATH_TYPES[type]) return FIXED_PATH_TYPES[type];
  if (!slug) return null;
  if (PREFIXED_TYPES[type]) return `${PREFIXED_TYPES[type]}${slug.replace(/^\/+/, "")}`;
  if (type === "page") return slug === "/" ? "/" : ensureLeadingSlash(slug).replace(/\/+$/, "");

  return null;
};

export const variantOf = (id) => {
  if (id.startsWith("drafts.")) return "draft";
  if (id.startsWith("versions.")) return "version";
  return "published";
};

export const baseIdOf = (id) =>
  id.startsWith("drafts.")
    ? id.slice("drafts.".length)
    : id.startsWith("versions.")
      ? id.split(".").slice(2).join(".")
      : id;

export const buildRouteIndex = (allDocuments) => {
  const documents = new Map();
  const draftOnly = new Map();
  const redirects = new Map();
  const pathOwners = new Map();
  const publishedIds = new Set(
    allDocuments.filter((document) => variantOf(document._id) === "published").map((d) => d._id),
  );

  for (const document of allDocuments) {
    const variant = variantOf(document._id);

    if (document._type === "redirect" && variant === "published") {
      const source = typeof document.source === "string" ? document.source.trim() : "";
      if (source.startsWith("/") && !/[:*(]/.test(source))
        redirects.set(source.length > 1 ? source.replace(/\/+$/, "") : source, document._id);
      continue;
    }

    if (!REFERENCEABLE_TYPES.includes(document._type)) continue;
    const path = documentPath(document);
    if (!path) continue;
    const target = {
      _id: baseIdOf(document._id),
      _type: document._type,
      title: document.metadata?.title ?? document.title ?? null,
    };
    if (!pathOwners.has(path)) pathOwners.set(path, target._id);

    if (variant === "published") documents.set(path, target);
    else if (variant === "draft" && !publishedIds.has(target._id) && !documents.has(path))
      draftOnly.set(path, target);
  }

  for (const path of documents.keys()) draftOnly.delete(path);

  return { documents, draftOnly, redirects, pathOwners };
};

export const classify = ({ path }, index) => {
  const target = index.documents.get(path);
  if (target) return { status: "document", target };

  if (index.draftOnly.has(path))
    return { status: "path", note: `target ${index.draftOnly.get(path)._id} is not published yet` };
  if (index.redirects.has(path))
    return { status: "path", note: `CMS redirect source (${index.redirects.get(path)}); consider linking the destination` };
  if (CODE_ROUTES.includes(path) || CODE_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix)))
    return { status: "path", note: "route served by code, not a CMS document" };
  if (path.endsWith(".md") && index.documents.has(path.slice(0, -3) || "/"))
    return { status: "path", note: "Markdown twin of a page" };

  return { status: "broken" };
};

const resolves = (path, index) => classify({ path }, index).status !== "broken";

const segmentToString = (segment) =>
  typeof segment === "number"
    ? `[${segment}]`
    : typeof segment === "object"
      ? `[_key==${JSON.stringify(segment.key)}]`
      : `.${segment}`;

export const toPatchPath = (segments) => segments.map(segmentToString).join("").replace(/^\./, "");

const isLinkObject = (value, inMarkDefs) =>
  typeof value.type === "string" &&
  (inMarkDefs || LINK_OBJECT_TYPES.has(value._type) || "external" in value || "internalPath" in value);

/**
 * Calls `visit` with every link object (`node: "link"`) and every other non-empty string
 * (`node: "string"`). A link's own `type`/`external`/`internalPath`/`params` are not visited as
 * strings: a stale `external` on a non-external link is hidden in the Studio and never rendered.
 */
export const walkDocument = (document, visit) => {
  const visitString = (value, segments, kind) => {
    if (value.trim()) visit({ node: "string", value, kind, patchPath: toPatchPath(segments) });
  };

  const walkEntries = (value, segments, owner, skipKeys) => {
    for (const [key, child] of Object.entries(value)) {
      if (skipKeys.has(key)) continue;
      if (typeof child === "string") {
        if (!SKIPPED_STRING_KEYS.has(key)) visitString(child, [...segments, key], `${owner}.${key}`);
        continue;
      }
      walk(child, [...segments, key], key, false, owner);
    }
  };

  const walk = (value, segments, parentKey, inMarkDefs, owner) => {
    if (Array.isArray(value)) {
      value.forEach((item, position) => {
        if (typeof item === "string") {
          visitString(item, [...segments, position], `${owner}.${parentKey}[]`);
          return;
        }
        const segment =
          item && typeof item === "object" && typeof item._key === "string" ? { key: item._key } : position;
        walk(item, [...segments, segment], parentKey, parentKey === "markDefs", owner);
      });
      return;
    }
    if (!value || typeof value !== "object") return;

    if (isLinkObject(value, inMarkDefs)) {
      const kind = inMarkDefs ? "richText link" : (value._type ?? parentKey ?? "link");
      visit({ node: "link", value, kind, patchPath: toPatchPath(segments) });
      walkEntries(value, segments, value._type ?? parentKey, LINK_FIELD_KEYS);
      return;
    }

    walkEntries(value, segments, value._type ?? parentKey, new Set());
  };

  for (const [key, child] of Object.entries(document)) {
    if (key.startsWith("_")) continue;
    if (typeof child === "string") visitString(child, [key], `${document._type}.${key}`);
    else walk(child, [key], key, false, document._type);
  }
};

const isSingleToken = (value) => /^\S+$/.test(value.trim());
const issueLabel = (issues) => issues.map((item) => item.name).join(", ");

export const scanDocuments = (allDocuments, { ownHosts = new Set(), trailingSlash = "never" } = {}) => {
  const index = buildRouteIndex(allDocuments);
  const findings = [];

  for (const document of allDocuments) {
    const base = {
      documentId: document._id,
      documentType: document._type,
      rev: document._rev,
      variant: variantOf(document._id),
    };
    const push = (finding) => findings.push({ ...base, ...finding });

    const httpFinding = (value, patchPath, kind, issueName, linkPatchPath) => {
      const suggested = upgradeHttp(value);
      if (!suggested || !isSingleToken(value)) return;
      const host = hostOf(value) ?? "?";
      const local = isLocalHost(host);
      push({
        rule: "http",
        issue: local ? "local or private host" : issueName,
        fixable: !local,
        kind,
        patchPath,
        value,
        suggested,
        fieldType: "url",
        host,
        own: ownHosts.has(stripWww(host)),
        ...(linkPatchPath ? { linkPatchPath } : {}),
      });
    };

    const ownUrlSlashFinding = (value, patchPath, kind, linkPatchPath) => {
      if (!parseOwnUrl(value, ownHosts) || !isSingleToken(value)) return;
      const { issues, fixed } = checkAbsoluteUrl(value, trailingSlash);
      if (!issues.length) return;
      push({
        rule: "slash",
        issue: issueLabel(issues),
        fixable: true,
        kind,
        patchPath,
        value,
        suggested: fixed,
        fieldType: "url",
        ...(linkPatchPath ? { linkPatchPath } : {}),
      });
    };

    walkDocument(document, (node) => {
      if (node.node === "string") {
        const parsed = parseOwnUrl(node.value, ownHosts);
        if (parsed && isSingleToken(node.value))
          push({
            rule: "own-domain",
            issue: "not convertible",
            status: "not convertible",
            convertible: false,
            fixable: false,
            kind: node.kind,
            patchPath: node.patchPath,
            value: node.value,
            ...parsed,
          });
        httpFinding(node.value, node.patchPath, node.kind, "url field");
        ownUrlSlashFinding(node.value, node.patchPath, node.kind);
        return;
      }

      const link = node.value;
      if (link.type === "external" && typeof link.external === "string") {
        const externalPath = `${node.patchPath}.external`;
        const own = parseOwnUrl(link.external, ownHosts);
        const sitePath = own ? null : parseSitePath(link.external);
        const parsed = own ?? sitePath;
        if (parsed) {
          const classification = classify(parsed, index);
          const note = [sitePath && "site path in an external link", classification.note]
            .filter(Boolean)
            .join("; ");
          push({
            rule: "own-domain",
            issue: classification.status,
            convertible: true,
            fixable: classification.status !== "broken",
            kind: node.kind,
            patchPath: node.patchPath,
            value: link.external,
            ...parsed,
            ...classification,
            ...(note ? { note } : {}),
            existing: {
              internal: link.internal !== undefined,
              internalPath: link.internalPath !== undefined,
              params: link.params !== undefined,
            },
          });
        }
        httpFinding(link.external, externalPath, node.kind, "external link", node.patchPath);
        ownUrlSlashFinding(link.external, externalPath, node.kind, node.patchPath);
        return;
      }

      if (link.type === "path" && typeof link.internalPath === "string" && link.internalPath.trim()) {
        const { issues, fixed } = checkInternalPath(link.internalPath, trailingSlash);
        let suggested = fixed;
        if (fixed !== null) {
          const [pathPart] = fixed.split(/[?#]/);
          const key = toRouteKey(pathPart);
          if (key !== key.toLowerCase() && !resolves(key, index) && resolves(key.toLowerCase(), index)) {
            issues.push(issue("uppercase (the lowercase path exists)"));
            suggested = `${pathPart.toLowerCase()}${fixed.slice(pathPart.length)}`;
          }
        }
        if (!issues.length) return;
        push({
          rule: "slash",
          issue: issueLabel(issues),
          fixable: issues.every((item) => item.fixable),
          kind: node.kind,
          patchPath: `${node.patchPath}.internalPath`,
          value: link.internalPath,
          suggested,
          fieldType: "path",
        });
      }
    });

    const slug = document.metadata?.slug?.current;
    if (typeof slug === "string" && (document._type === "page" || PREFIXED_TYPES[document._type])) {
      const { issues, fixed } = checkSlug(document._type, slug);
      if (issues.length) {
        const fixedPath = fixed ? documentPath({ _type: document._type, metadata: { slug: { current: fixed } } }) : null;
        const owner = fixedPath ? index.pathOwners.get(fixedPath) : undefined;
        if (owner && owner !== baseIdOf(document._id)) issues.push(issue(`collides with ${owner}`, false));
        push({
          rule: "slash",
          issue: `slug ${issueLabel(issues)}`,
          fixable: issues.every((item) => item.fixable),
          kind: `${document._type}.metadata.slug`,
          patchPath: "metadata.slug.current",
          value: slug,
          suggested: fixed,
          fieldType: "slug",
        });
      }
    }
  }

  return { index, findings };
};

const commonSkip = (finding, drafts) => {
  if (finding.variant === "version") return "release version (edit it in the Studio)";
  if (finding.variant === "draft" && drafts === "skip") return "draft (--drafts=skip)";
  return null;
};

export const decideAction = (finding, options = {}) => {
  const { mode = "auto", includeBroken = false, drafts = "both", keepHttp = new Set(), verifyHttps = false } = options;
  const skip = commonSkip(finding, drafts);
  if (skip) return { action: "skip", reason: skip };

  if (finding.rule === "own-domain") {
    if (!finding.convertible) return { action: "skip", reason: "field is not a link object" };
    if (finding.status === "broken" && !includeBroken)
      return { action: "skip", reason: "broken: no route at this path (fix by hand or --include-broken)" };
    if (mode === "reference")
      return finding.status === "document"
        ? { action: "reference" }
        : { action: "skip", reason: "no published document at this path (--to=reference)" };
    if (mode === "path") return { action: "path" };
    return finding.status === "document" ? { action: "reference" } : { action: "path" };
  }

  if (finding.rule === "http") {
    if (!finding.fixable) return { action: "skip", reason: "local or private host" };
    if (keepHttp.has(stripWww(finding.host))) return { action: "skip", reason: "host kept on http (--keep-http)" };
    if (verifyHttps && !finding.https?.ok)
      return { action: "skip", reason: `https did not answer (${finding.https?.status ?? "not checked"})` };
    return { action: "https" };
  }

  if (!finding.fixable) return { action: "skip", reason: `report only: ${finding.issue}` };
  return { action: "slash" };
};

export const buildOperations = (finding, action, { trailingSlash = "never" } = {}) => {
  const base = finding.patchPath;
  const set = {};
  const unset = [`${base}.external`];

  if (action === "reference") {
    set[`${base}.type`] = "internal";
    set[`${base}.internal`] = { _type: "reference", _ref: finding.target._id };
    if (finding.existing.internalPath) unset.push(`${base}.internalPath`);
  } else {
    set[`${base}.type`] = "path";
    set[`${base}.internalPath`] = applyTrailingSlash(finding.path, trailingSlash);
    if (finding.existing.internal) unset.push(`${base}.internal`);
  }

  if (finding.params) set[`${base}.params`] = finding.params;
  else if (finding.existing.params) unset.push(`${base}.params`);

  return { set, unset };
};

export const rewriteValue = (value, fixes, trailingSlash) => {
  let result = value;
  for (const fix of [...fixes].sort((a, b) => (a.rule === "http" ? -1 : b.rule === "http" ? 1 : 0))) {
    if (fix.rule === "http") result = upgradeHttp(result) ?? result;
    else if (fix.fieldType === "url") result = checkAbsoluteUrl(result, trailingSlash).fixed;
    else result = fix.suggested;
  }
  return result;
};

/**
 * One patch per document. Fixes to the same string (http + slash on one URL) are combined; a
 * link that becomes internal drops the fixes to its `external` value, which count as resolved.
 */
export const planPatches = (findings, options = {}) => {
  const { rules = RULES, trailingSlash = "never" } = options;
  const byDocument = new Map();
  const skipped = [];
  const entryFor = (finding) => {
    if (!byDocument.has(finding.documentId))
      byDocument.set(finding.documentId, {
        documentId: finding.documentId,
        documentType: finding.documentType,
        rev: finding.rev,
        variant: finding.variant,
        set: {},
        unset: [],
        changes: [],
        resolves: 0,
      });
    return byDocument.get(finding.documentId);
  };

  const convertedLinks = new Set();
  const stringFixes = new Map();

  for (const finding of findings) {
    if (!rules.includes(finding.rule)) continue;
    const decision = decideAction(finding, options);
    if (decision.action === "skip") {
      skipped.push({ ...finding, reason: decision.reason });
      continue;
    }

    if (finding.rule !== "own-domain") {
      const key = `${finding.documentId}|${finding.patchPath}`;
      stringFixes.set(key, [...(stringFixes.get(key) ?? []), finding]);
      continue;
    }

    const operations = buildOperations(finding, decision.action, { trailingSlash });
    const entry = entryFor(finding);
    Object.assign(entry.set, operations.set);
    entry.unset.push(...operations.unset);
    entry.resolves += 1;
    entry.changes.push({
      rule: finding.rule,
      kind: finding.kind,
      patchPath: finding.patchPath,
      from: finding.value,
      to:
        decision.action === "reference"
          ? `reference → ${finding.target._type} ${finding.target._id}${finding.params ? ` + params ${finding.params}` : ""}`
          : `path ${operations.set[`${finding.patchPath}.internalPath`]}${finding.params ?? ""}`,
      action: decision.action,
    });
    convertedLinks.add(`${finding.documentId}|${finding.patchPath}`);
  }

  for (const fixes of stringFixes.values()) {
    const [first] = fixes;
    const entry = entryFor(first);
    entry.resolves += fixes.length;
    if (first.linkPatchPath && convertedLinks.has(`${first.documentId}|${first.linkPatchPath}`)) continue;

    const to = rewriteValue(first.value, fixes, trailingSlash);
    entry.set[first.patchPath] = to;
    entry.changes.push({
      rule: fixes.map((fix) => fix.rule).join("+"),
      kind: first.kind,
      patchPath: first.patchPath,
      from: first.value,
      to,
      action: fixes.map((fix) => (fix.rule === "http" ? "https" : "slash")).join("+"),
    });
  }

  return { patches: [...byDocument.values()], skipped };
};

const countBy = (items, readKey) => {
  const counts = {};
  for (const item of items) counts[readKey(item)] = (counts[readKey(item)] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
};

export const summarize = (findings) => {
  const rows = new Map();
  for (const finding of findings) {
    const key = `${finding.rule}|${finding.issue}`;
    if (!rows.has(key))
      rows.set(key, { rule: finding.rule, issue: finding.issue, total: 0, fixable: 0, published: 0, draft: 0, version: 0 });
    const row = rows.get(key);
    row.total += 1;
    if (finding.fixable) row.fixable += 1;
    row[finding.variant] += 1;
  }
  const ownDomain = findings.filter((finding) => finding.rule === "own-domain");

  return {
    total: findings.length,
    documents: new Set(findings.map((finding) => finding.documentId)).size,
    table: [...rows.values()].sort((a, b) => RULES.indexOf(a.rule) - RULES.indexOf(b.rule) || b.total - a.total),
    byVariant: countBy(findings, (finding) => finding.variant),
    ownDomain: {
      byStatus: countBy(ownDomain, (finding) => finding.status),
      byDocumentType: countBy(ownDomain, (finding) => finding.documentType),
      byFieldKind: countBy(ownDomain, (finding) => finding.kind),
    },
    httpHosts: countBy(
      findings.filter((finding) => finding.rule === "http"),
      (finding) => finding.host,
    ),
  };
};
