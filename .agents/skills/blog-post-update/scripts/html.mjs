// The same file ships as blog-post-update/scripts/html.mjs: change both (a test compares them).
// A small HTML reader for published pages, no packages: it is not a browser, so a page that
// renders its article with client-side JavaScript has nothing to read here.

const VOID = new Set("area base br col embed hr img input link meta param source track wbr".split(" "));
const RAW_TEXT = new Set(["script", "style", "noscript", "template", "textarea", "svg", "math", "iframe"]);
const BLOCK = new Set(
  "address article aside blockquote dd details dialog div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr li main nav ol p pre section summary table tbody td tfoot th thead tr ul body html".split(" "),
);
// A start tag of one of these closes an open <p>, as browsers do.
const CLOSES_P = new Set("address article aside blockquote details div dl fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr main nav ol p pre section table ul".split(" "));
// A start tag that ends an open sibling, up to (not past) its container.
const IMPLIED_END = {
  li: [["li"], ["ul", "ol", "menu"]],
  dt: [["dt", "dd"], ["dl"]],
  dd: [["dt", "dd"], ["dl"]],
  tr: [["tr"], ["table", "tbody", "thead", "tfoot"]],
  td: [["td", "th"], ["tr", "table"]],
  th: [["td", "th"], ["tr", "table"]],
  option: [["option"], ["select", "datalist"]],
};
const STRIPPED = new Set(["nav", "aside", "footer", "form", "button", "dialog", "select", "head", "noscript", "script", "style", "template", "svg", "iframe"]);

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»", bull: "•", middot: "·", copy: "©", reg: "®", trade: "™", times: "×", euro: "€", pound: "£", shy: "", zwj: "", zwnj: "" };

export const decodeEntities = (text) =>
  String(text).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (match, name) => {
    if (name[0] === "#") {
      const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[name.toLowerCase()] ?? match;
  });

const parseAttributes = (source) => {
  const attrs = {};
  for (const [, name, , double, single, bare] of source.matchAll(/([^\s"'>/=]+)(\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))
    attrs[name.toLowerCase()] = decodeEntities(double ?? single ?? bare ?? "");
  return attrs;
};

/** HTML to a light tree: `{ tag, attrs, children }` elements and strings. Forgiving, like a browser. */
export const parseHtml = (html) => {
  const root = { tag: "#root", attrs: {}, children: [] };
  const stack = [root];
  const open = (tag) => stack.some((node) => node.tag === tag);
  const closeTo = (tag) => {
    for (let index = stack.length - 1; index > 0; index -= 1)
      if (stack[index].tag === tag) {
        stack.length = index;
        return;
      }
  };
  const source = String(html);
  const token = /<!--[\s\S]*?(?:-->|$)|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<\?[^>]*>|<\/([a-zA-Z][\w:-]*)[^>]*>|<([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let last = 0;
  for (let match = token.exec(source); match; match = token.exec(source)) {
    if (match.index > last) stack[stack.length - 1].children.push(decodeEntities(source.slice(last, match.index)));
    last = token.lastIndex;
    const [, closing, opening, rawAttributes] = match;
    if (closing) {
      const tag = closing.toLowerCase();
      if (tag === "p" && !open("p")) stack[stack.length - 1].children.push({ tag: "p", attrs: {}, children: [] });
      else if (open(tag)) closeTo(tag);
      continue;
    }
    if (!opening) continue;
    const tag = opening.toLowerCase();
    if (CLOSES_P.has(tag) && open("p")) closeTo("p");
    if (IMPLIED_END[tag]) {
      const [ends, boundaries] = IMPLIED_END[tag];
      for (let index = stack.length - 1; index > 0 && !boundaries.includes(stack[index].tag); index -= 1)
        if (ends.includes(stack[index].tag)) {
          stack.length = index;
          break;
        }
    }
    const node = { tag, attrs: parseAttributes(rawAttributes ?? ""), children: [] };
    stack[stack.length - 1].children.push(node);
    if (RAW_TEXT.has(tag)) {
      const end = source.toLowerCase().indexOf(`</${tag}`, last);
      const stop = end === -1 ? source.length : end;
      if (tag === "textarea") node.children.push(decodeEntities(source.slice(last, stop)));
      const close = end === -1 ? source.length : source.indexOf(">", end) + 1 || source.length;
      token.lastIndex = close;
      last = close;
      continue;
    }
    if (!VOID.has(tag) && !/\/\s*$/.test(rawAttributes ?? "")) stack.push(node);
  }
  if (last < source.length) stack[stack.length - 1].children.push(decodeEntities(source.slice(last)));
  return root;
};

const isElement = (node) => node && typeof node === "object";

export const findAll = (node, test, found = []) => {
  if (!isElement(node)) return found;
  if (node.tag !== "#root" && test(node)) found.push(node);
  for (const child of node.children) findAll(child, test, found);
  return found;
};

export const findFirst = (node, test) => findAll(node, test)[0] ?? null;

export const textOf = (node) => (typeof node === "string" ? node : isElement(node) ? node.children.map(textOf).join("") : "");

const clean = (text) => String(text ?? "").replace(/\s+/g, " ").trim();

/** `tag`, `.class`, `#id`, `tag.class` or `[attr=value]`: enough to point at a site's article. */
export const matchesSelector = (node, selector) => {
  const match = String(selector).trim().match(/^([a-z][\w-]*)?(?:#([\w-]+))?(?:\.([\w-]+))?(?:\[([\w-]+)(?:=["']?([^"'\]]*)["']?)?\])?$/i);
  if (!match) return false;
  const [, tag, id, className, attr, value] = match;
  if (tag && node.tag !== tag.toLowerCase()) return false;
  if (id && node.attrs.id !== id) return false;
  if (className && !(node.attrs.class ?? "").split(/\s+/).includes(className)) return false;
  if (attr && (value === undefined ? !(attr in node.attrs) : node.attrs[attr.toLowerCase()] !== value)) return false;
  return Boolean(tag || id || className || attr);
};

const hidden = (node) => node.attrs.hidden !== undefined || node.attrs["aria-hidden"] === "true" || /(^|;)\s*display\s*:\s*none/i.test(node.attrs.style ?? "");

/**
 * The element that holds the article: `--content` when given, else the one <article> that
 * carries most of <main>'s text, else <main>, else <body>.
 */
export const contentRoot = (tree, selector) => {
  if (selector) return findFirst(tree, (node) => matchesSelector(node, selector));
  const main = findFirst(tree, (node) => node.tag === "main" || node.attrs.role === "main") ?? findFirst(tree, (node) => node.tag === "body") ?? tree;
  const size = (node) => clean(textOf(strip(node))).length;
  const articles = findAll(main, (node) => node.tag === "article").sort((a, b) => size(b) - size(a));
  if (articles[0] && size(articles[0]) >= 0.4 * size(main)) return articles[0];
  return main;
};

/** A copy without navigation, sidebars, forms, footers and hidden parts. */
export const strip = (node, { dropHeader = false } = {}) => {
  if (!isElement(node)) return node;
  return {
    ...node,
    children: node.children
      .filter((child) => !isElement(child) || (!STRIPPED.has(child.tag) && !(dropHeader && child.tag === "header") && !hidden(child) && child.attrs.role !== "navigation"))
      .map((child) => strip(child, { dropHeader })),
  };
};

const metaContent = (tree, test) => findFirst(tree, (node) => node.tag === "meta" && test(node.attrs))?.attrs.content ?? null;

const jsonLdDates = (tree) => {
  const dates = {};
  for (const script of findAll(tree, (node) => node.tag === "script" && /ld\+json/i.test(node.attrs.type ?? ""))) {
    const visit = (value) => {
      if (Array.isArray(value)) return value.forEach(visit);
      if (!value || typeof value !== "object") return;
      dates.published ??= value.datePublished;
      dates.modified ??= value.dateModified;
      Object.values(value).forEach(visit);
    };
    try {
      visit(JSON.parse(textOf(script)));
    } catch {}
  }
  return dates;
};

const resolveUrl = (href, base) => {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
};

/** Title, headline, description, canonical, robots and dates from a page's head and markup. */
export const pageInfo = (tree, url) => {
  const head = findFirst(tree, (node) => node.tag === "head") ?? tree;
  const title = clean(textOf(findFirst(head, (node) => node.tag === "title") ?? ""));
  const h1 = clean(textOf(findFirst(tree, (node) => node.tag === "h1") ?? ""));
  const canonicalHref = findFirst(head, (node) => node.tag === "link" && /(^|\s)canonical(\s|$)/i.test(node.attrs.rel ?? ""))?.attrs.href;
  const robots = metaContent(head, (attrs) => /^(robots|googlebot)$/i.test(attrs.name ?? "")) ?? "";
  const ld = jsonLdDates(tree);
  return {
    url,
    title: h1 || clean(metaContent(head, (attrs) => attrs.property === "og:title")) || title,
    seoTitle: title,
    description: clean(metaContent(head, (attrs) => /^description$/i.test(attrs.name ?? "")) ?? metaContent(head, (attrs) => attrs.property === "og:description") ?? ""),
    canonical: canonicalHref ? resolveUrl(canonicalHref, url) : null,
    noIndex: /noindex/i.test(robots),
    lang: findFirst(tree, (node) => node.tag === "html")?.attrs.lang ?? null,
    publishedAt: metaContent(head, (attrs) => attrs.property === "article:published_time") ?? ld.published ?? null,
    modifiedAt: metaContent(head, (attrs) => attrs.property === "article:modified_time") ?? ld.modified ?? null,
  };
};

const escapeMarkdown = (text) => text.replace(/([*_`[\]\\])/g, "\\$1");

const wrap = (text, mark) => {
  const lead = text.match(/^\s*/)[0];
  const tail = text.match(/\s*$/)[0];
  const core = text.trim();
  return core ? `${lead}${mark}${core}${mark}${tail}` : text;
};

/**
 * Pieces of one run of inline content: plain text with link ranges for matching, and the
 * same run as Markdown. `href` is absolute; `linkHref` shortens own-site links to paths.
 */
const inline = (nodes, context) => {
  let text = "";
  let markdown = "";
  const links = [];
  const images = [];
  const visit = (node, marks) => {
    if (typeof node === "string") {
      const piece = node.replace(/\s+/g, " ");
      text += piece;
      let md = escapeMarkdown(piece);
      if (marks.code) md = piece;
      markdown += md;
      return;
    }
    if (!isElement(node) || STRIPPED.has(node.tag) || hidden(node)) return;
    if (node.tag === "br") {
      text += " ";
      markdown += " ";
      return;
    }
    if (node.tag === "img") {
      // Lazy-loading plugins put a placeholder in src and the real image in a data attribute.
      const candidates = [node.attrs["data-src"], node.attrs["data-lazy-src"], node.attrs["data-original"], node.attrs.src, (node.attrs["data-srcset"] ?? node.attrs.srcset ?? "").split(/\s+/)[0]];
      const src = resolveUrl(candidates.find((value) => value && !value.startsWith("data:")) ?? "", context.url);
      if (src) {
        images.push({ src, alt: node.attrs.alt ?? "" });
        markdown += `![${escapeMarkdown(clean(node.attrs.alt ?? ""))}](${context.linkHref(src)})`;
      }
      return;
    }
    const tag = node.tag;
    if (tag === "a" && node.attrs.href && !/^(javascript:|#)/i.test(node.attrs.href)) {
      const href = resolveUrl(node.attrs.href, context.url);
      const start = text.length;
      const innerStart = markdown.length;
      node.children.forEach((child) => visit(child, marks));
      const inner = text.slice(start);
      if (href && inner.trim()) {
        links.push({ start: start + inner.length - inner.trimStart().length, end: text.length - (inner.length - inner.trimEnd().length), href });
        const label = markdown.slice(innerStart);
        const lead = label.match(/^\s*/)[0];
        const tail = label.match(/\s*$/)[0];
        markdown = `${markdown.slice(0, innerStart)}${lead}[${label.trim()}](${context.linkHref(href)})${tail}`;
      }
      return;
    }
    const mark = ["strong", "b"].includes(tag) ? "**" : ["em", "i", "cite"].includes(tag) ? "_" : tag === "code" || tag === "kbd" ? "`" : null;
    if (mark && !marks.code) {
      const before = markdown.length;
      node.children.forEach((child) => visit(child, { ...marks, code: mark === "`" }));
      const inner = markdown.slice(before);
      markdown = markdown.slice(0, before) + (mark === "`" ? (inner.trim() ? `\`${inner}\`` : inner) : wrap(inner, mark));
      return;
    }
    node.children.forEach((child) => visit(child, marks));
  };
  for (const node of nodes) visit(node, {});
  const leading = text.length - text.trimStart().length;
  const trimmed = text.trim();
  return {
    text: trimmed,
    markdown: markdown.trim(),
    links: links
      .map((link) => ({ ...link, start: Math.max(0, link.start - leading), end: Math.min(trimmed.length, link.end - leading) }))
      .filter((link) => link.end > link.start),
    images,
  };
};

const tableMarkdown = (node, context) => {
  const rows = findAll(node, (child) => child.tag === "tr").map((row) =>
    row.children.filter((cell) => isElement(cell) && ["td", "th"].includes(cell.tag)).map((cell) => inline(cell.children, context).markdown.replace(/\|/g, "\\|")),
  );
  if (!rows.length) return "";
  const width = Math.max(...rows.map((row) => row.length));
  const line = (cells) => `| ${Array.from({ length: width }, (_, index) => cells[index] ?? "").join(" | ")} |`;
  return [line(rows[0]), `|${" --- |".repeat(width)}`, ...rows.slice(1).map(line)].join("\n");
};

/**
 * The article as a list of blocks: `{ kind, level?, list?, depth?, quote, text, markdown,
 * links }`. kind is heading / paragraph / item / quote / code / table / image / rule. Inline
 * text sitting next to block children (an <li> with a nested list) becomes its own block.
 */
export const extractBlocks = (root, { url, ownHosts = new Set() } = {}) => {
  const linkHref = (href) => {
    try {
      const parsed = new URL(href);
      if (ownHosts.has(parsed.hostname.replace(/^www\./, ""))) return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {}
    return href;
  };
  const context = { url, linkHref };
  const blocks = [];
  const push = (block) => {
    if (block.kind !== "rule" && !block.text && !block.markdown) return;
    blocks.push(block);
  };

  const walk = (node, frame) => {
    let run = [];
    const flush = () => {
      if (!run.length) return;
      const result = inline(run, context);
      run = [];
      if (!result.text && !result.images.length) return;
      const kind = !result.text ? "image" : frame.kind;
      push({ kind, ...(frame.level ? { level: frame.level } : {}), ...(frame.list ? { list: frame.list, depth: frame.depth } : {}), quote: frame.quote, text: result.text, markdown: result.markdown, links: result.links });
    };
    for (const child of node.children) {
      if (!isElement(child) || !BLOCK.has(child.tag)) {
        if (isElement(child) && (STRIPPED.has(child.tag) || hidden(child))) continue;
        run.push(child);
        continue;
      }
      flush();
      if (STRIPPED.has(child.tag) || hidden(child)) continue;
      const tag = child.tag;
      if (/^h[1-6]$/.test(tag)) walk(child, { ...frame, kind: "heading", level: Number(tag[1]) });
      else if (tag === "p" || tag === "dt" || tag === "dd" || tag === "figcaption" || tag === "summary") walk(child, { ...frame, kind: frame.list ? "item" : frame.quote ? "quote" : "paragraph", level: undefined });
      else if (tag === "li") walk(child, { ...frame, kind: "item", level: undefined });
      else if (tag === "ul" || tag === "ol") walk(child, { ...frame, list: tag === "ol" ? "number" : "bullet", depth: (frame.depth ?? 0) + 1, kind: "item" });
      else if (tag === "blockquote") walk(child, { ...frame, kind: "quote", quote: true });
      else if (tag === "pre") {
        const code = textOf(child).replace(/^\n|\n$/g, "");
        push({ kind: "code", quote: frame.quote, text: clean(code), markdown: `\`\`\`\n${code}\n\`\`\``, links: [] });
      } else if (tag === "table") push({ kind: "table", quote: frame.quote, text: clean(findAll(child, (cell) => ["td", "th"].includes(cell.tag)).map(textOf).join(" ")), markdown: tableMarkdown(child, context), links: [] });
      else if (tag === "hr") push({ kind: "rule", quote: false, text: "", markdown: "---", links: [] });
      else walk(child, { ...frame, kind: frame.list && tag !== "div" ? "item" : frame.kind === "heading" ? "paragraph" : frame.kind, level: undefined });
    }
    flush();
  };
  walk(root, { kind: "paragraph", quote: false });
  return blocks;
};

/** One Markdown chunk per block, as `blog-post-update` diffs them. */
export const blockMarkdown = (block) => {
  const body =
    block.kind === "heading"
      ? `${"#".repeat(block.level)} ${block.markdown}`
      : block.kind === "item"
        ? `${"  ".repeat(Math.max(0, (block.depth ?? 1) - 1))}${block.list === "number" ? "1." : "-"} ${block.markdown}`
        : block.markdown;
  return block.quote && block.kind !== "heading" ? body.split("\n").map((line) => `> ${line}`).join("\n") : body;
};

export const toMarkdown = (blocks) => blocks.map(blockMarkdown).join("\n\n");

/** `<loc>` and `<lastmod>` of a sitemap or sitemap index. */
export const parseSitemap = (xml) => {
  const entries = [];
  for (const [, inner] of String(xml).matchAll(/<(?:url|sitemap)\b[^>]*>([\s\S]*?)<\/(?:url|sitemap)>/gi)) {
    const loc = inner.match(/<loc>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/loc>/i)?.[1];
    if (!loc) continue;
    const lastmod = inner.match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/i)?.[1] ?? null;
    entries.push({ loc: decodeEntities(loc.trim()), lastmod });
  }
  return { isIndex: /<sitemapindex\b/i.test(xml), entries };
};

/** Disallow/Allow rules for `User-agent: *` (or the named agent), longest match wins. */
export const robotsRules = (text, agent = "*") => {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const match = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!match) continue;
    const [, field, value] = match;
    const key = field.toLowerCase();
    if (key === "user-agent") {
      if (!lastWasAgent) groups.push((current = { agents: [], rules: [] }));
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (current && (key === "allow" || key === "disallow") && value) current.rules.push({ allow: key === "allow", pattern: value });
  }
  const sitemaps = [...String(text).matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map((match) => match[1]);
  const group = groups.find((item) => item.agents.includes(agent.toLowerCase())) ?? groups.find((item) => item.agents.includes("*"));
  const rules = (group?.rules ?? []).map((rule) => ({
    ...rule,
    regex: new RegExp(`^${rule.pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$")}`),
  }));
  return {
    sitemaps,
    allowed: (path) => {
      const hits = rules.filter((rule) => rule.regex.test(path)).sort((a, b) => b.pattern.length - a.pattern.length || Number(b.allow) - Number(a.allow));
      return !hits.length || hits[0].allow;
    },
  };
};

/** Path for comparing pages: no query, no fragment, no trailing slash (except the root). */
export const normalizePath = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  const path = value.trim().split(/[?#]/)[0];
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
};

export const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

/** The site path of an own-site URL, or null for another site. */
export const ownPath = (href, ownHosts) => {
  try {
    const url = new URL(href);
    return ownHosts.has(url.hostname.replace(/^www\./, "")) ? normalizePath(decodeURI(url.pathname)) : null;
  } catch {
    return null;
  }
};

export const USER_AGENT = "Mozilla/5.0 (compatible; content-review-skill; +https://agentskills.io)";

/** GET a page; follows redirects, reports the final URL. Never throws: `{ ok, status, url, html, error }`. */
export const fetchPage = async (url, { timeout = 15000 } = {}) => {
  try {
    const response = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" }, redirect: "follow", signal: AbortSignal.timeout(timeout) });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok) return { ok: false, status: response.status, url: response.url || url, error: `HTTP ${response.status}` };
    if (!/html|xml/i.test(type)) return { ok: false, status: response.status, url: response.url || url, error: `not HTML (${type || "no content type"})` };
    return { ok: true, status: response.status, url: response.url || url, html: await response.text() };
  } catch (error) {
    return { ok: false, status: 0, url, error: error?.name === "TimeoutError" ? "timed out" : String(error?.cause?.code ?? error?.message ?? error) };
  }
};

/** Everything a skill needs from one fetched page. */
export const readPage = (html, url, { content, ownHosts = new Set([hostOf(url)]), allLinks = false } = {}) => {
  const tree = parseHtml(html);
  const info = pageInfo(tree, url);
  // Every own-site link on the page, navigation included: how a crawl without a sitemap finds pages.
  const links = allLinks
    ? [...new Set(findAll(tree, (node) => node.tag === "a" && node.attrs.href).map((node) => resolveUrl(node.attrs.href, url)).filter((href) => href && ownPath(href, ownHosts)))]
    : undefined;
  const root = contentRoot(tree, content);
  if (!root) return { ...info, blocks: [], contentFound: false, links };
  const cleaned = strip(root, { dropHeader: root.tag === "body" });
  return { ...info, blocks: extractBlocks(cleaned, { url, ownHosts }), contentFound: true, contentTag: root.tag, links };
};
