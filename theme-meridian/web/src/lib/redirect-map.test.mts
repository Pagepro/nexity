import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRedirectMap,
  buildRewriteRules,
  matchRedirect,
  matchRewrite,
  normalizeDestination,
  normalizePath,
} from "./redirect-map.ts";

const entry = (
  source: string,
  destination: string,
  permanent: boolean | null = true,
) => ({
  source,
  destination,
  permanent,
});

const query = (value: string) => new URLSearchParams(value);

test("normalizePath strips the trailing slash, query and hash but keeps the root", () => {
  assert.equal(normalizePath("/about/"), "/about");
  assert.equal(normalizePath("/about"), "/about");
  assert.equal(normalizePath("/about/?utm=x"), "/about");
  assert.equal(normalizePath("/faq#pricing"), "/faq");
  assert.equal(normalizePath("/t%26c"), "/t&c");
  assert.equal(normalizePath("/"), "/");
  assert.equal(normalizePath(""), "/");
});

test("an exact path redirect is matched with or without the trailing slash", () => {
  const table = buildRedirectMap([entry("/old", "/new")]);

  assert.deepEqual(matchRedirect(table, "/old"), {
    destination: "/new",
    permanent: true,
  });
  assert.deepEqual(matchRedirect(table, "/old/"), {
    destination: "/new",
    permanent: true,
  });
  assert.equal(matchRedirect(table, "/old/child"), undefined);
});

test("a temporary document is kept and served as temporary", () => {
  const table = buildRedirectMap([entry("/sale", "/offers", false)]);

  assert.deepEqual(matchRedirect(table, "/sale"), {
    destination: "/offers",
    permanent: false,
  });
  assert.deepEqual(table.skipped, []);
});

test("a document with no permanent flag counts as permanent (the schema default)", () => {
  const table = buildRedirectMap([entry("/old", "/new", null)]);

  assert.equal(matchRedirect(table, "/old")?.permanent, true);
});

test("a self-referencing document is dropped instead of looping", () => {
  const { exact, skipped } = buildRedirectMap([entry("/loop/", "/loop")]);

  assert.deepEqual(exact, {});
  assert.deepEqual(skipped, [{ source: "/loop/", reason: "points at itself" }]);
});

test("normalizeDestination makes a bare slug root-relative and leaves the rest alone", () => {
  assert.equal(normalizeDestination("about"), "/about");
  assert.equal(normalizeDestination("/blog/post/"), "/blog/post/");
  assert.equal(normalizeDestination("https://example.com/x"), "https://example.com/x");
  assert.equal(normalizeDestination("mailto:hi@example.com"), "mailto:hi@example.com");
  assert.equal(normalizeDestination("//example.com/x"), "//example.com/x");
  assert.equal(normalizeDestination(""), "");
});

test("a bare slug that names its own source is dropped, not served as a loop", () => {
  const { exact, skipped } = buildRedirectMap([entry("/about", "about")]);

  assert.deepEqual(exact, {});
  assert.deepEqual(skipped, [{ source: "/about", reason: "points at itself" }]);
});

test("two documents claiming one source keep the first and report the second", () => {
  const { exact, skipped } = buildRedirectMap([
    entry("/one", "/first"),
    entry("/one", "/second"),
  ]);

  assert.equal(exact["/one"].destination, "/first");
  assert.match(skipped[0].reason, /second document/);
});

test("an incomplete or non-path document is left out", () => {
  const { exact, rules } = buildRedirectMap([
    { source: null, destination: "/x", permanent: true },
    { source: "/y", destination: null, permanent: true },
    entry("https://example.com/z", "/z"),
    entry("//example.com/z", "/z"),
  ]);

  assert.deepEqual(exact, {});
  assert.deepEqual(rules, []);
});

test("a destination keeps its extension, its query and an external URL", () => {
  const { exact } = buildRedirectMap([
    entry("/terms", "/docs/terms-of-service.pdf"),
    entry("/q", "/quote?utm=campaign"),
    entry("/partner", "https://example.com/partner"),
  ]);

  assert.equal(exact["/terms"].destination, "/docs/terms-of-service.pdf");
  assert.equal(exact["/q"].destination, "/quote?utm=campaign");
  assert.equal(exact["/partner"].destination, "https://example.com/partner");
});

test("a chain is collapsed to its final target, in one hop", () => {
  const { exact, collapsed } = buildRedirectMap([
    entry("/a", "/b"),
    entry("/b", "/c"),
    entry("/c", "/d"),
  ]);

  assert.equal(exact["/a"].destination, "/d");
  assert.equal(exact["/b"].destination, "/d");
  assert.equal(exact["/c"].destination, "/d");
  assert.deepEqual(
    collapsed.map(({ source }) => source),
    ["/a", "/b"],
  );
  assert.deepEqual(collapsed[0], { source: "/a", via: ["/b", "/c"], destination: "/d" });
});

test("collapsing does not depend on the document order", () => {
  const { exact } = buildRedirectMap([
    entry("/c", "/d"),
    entry("/a", "/b"),
    entry("/b", "/c"),
  ]);

  assert.equal(exact["/a"].destination, "/d");
});

test("a collapsed chain is permanent only when every hop is", () => {
  const { exact } = buildRedirectMap([
    entry("/a", "/b"),
    entry("/b", "/c", false),
    entry("/x", "/y"),
    entry("/y", "/z"),
  ]);

  assert.deepEqual(exact["/a"], { destination: "/c", permanent: false });
  assert.deepEqual(exact["/x"], { destination: "/z", permanent: true });
});

test("a chain stops at an external destination", () => {
  const { exact, collapsed } = buildRedirectMap([
    entry("/a", "/b"),
    entry("/b", "https://example.com/b"),
  ]);

  assert.equal(exact["/a"].destination, "https://example.com/b");
  assert.equal(collapsed.length, 1);
});

test("a chain is collapsed through the trailing slash the key drops", () => {
  const { exact } = buildRedirectMap([entry("/a", "/b/"), entry("/b", "/c")]);

  assert.equal(exact["/a"].destination, "/c");
});

test("a hop's query and hash ride along, as they do at request time", () => {
  const { exact } = buildRedirectMap([
    entry("/a", "/b?utm=one#top"),
    entry("/b", "/c?utm=two"),
    entry("/q", "/r#first"),
    entry("/r", "/s"),
  ]);

  // The later destination wins on a clash, exactly as proxy.ts merges.
  assert.equal(exact["/a"].destination, "/c?utm=two#top");
  assert.equal(exact["/q"].destination, "/s#first");
});

test("a two-document loop is dropped rather than served", () => {
  const { exact, skipped } = buildRedirectMap([
    entry("/a", "/b"),
    entry("/b", "/a"),
    entry("/keep", "/kept"),
  ]);

  assert.deepEqual(Object.keys(exact), ["/keep"]);
  assert.deepEqual(skipped.map(({ source }) => source).sort(), ["/a", "/b"]);
  assert.match(skipped[0].reason, /cyclic/);
});

test("a source that enters a loop is dropped with it", () => {
  const { exact } = buildRedirectMap([
    entry("/in", "/a"),
    entry("/a", "/b"),
    entry("/b", "/a"),
  ]);

  assert.deepEqual(exact, {});
});

test("an unchained redirect is reported as no chain at all", () => {
  const { collapsed } = buildRedirectMap([entry("/a", "/b"), entry("/c", "/d")]);

  assert.deepEqual(collapsed, []);
});

test("a :param pattern captures one segment into the destination", () => {
  const table = buildRedirectMap([entry("/old-blog/:slug", "/blog/:slug")]);

  assert.deepEqual(matchRedirect(table, "/old-blog/my-post"), {
    destination: "/blog/my-post",
    permanent: true,
  });
  assert.equal(matchRedirect(table, "/old-blog"), undefined);
  assert.equal(matchRedirect(table, "/old-blog/a/b"), undefined);
});

test("a :param* pattern captures any depth, including none", () => {
  const table = buildRedirectMap([entry("/docs/:path*", "/help/:path*")]);

  assert.equal(matchRedirect(table, "/docs/a/b/c")?.destination, "/help/a/b/c");
  assert.equal(matchRedirect(table, "/docs")?.destination, "/help");
});

test("a :param+ pattern needs at least one segment", () => {
  const table = buildRedirectMap([entry("/files/:path+", "/assets/:path+")]);

  assert.equal(matchRedirect(table, "/files/a/b")?.destination, "/assets/a/b");
  assert.equal(matchRedirect(table, "/files"), undefined);
});

test("a pattern's output is resolved through the exact map in one hop", () => {
  const table = buildRedirectMap([
    entry("/old-blog/:slug", "/blog/:slug"),
    entry("/blog/renamed", "/blog/current"),
  ]);

  assert.equal(matchRedirect(table, "/old-blog/renamed")?.destination, "/blog/current");
});

test("an exact document wins over a pattern that also matches", () => {
  const table = buildRedirectMap([
    entry("/old-blog/:slug", "/blog/:slug"),
    entry("/old-blog/special", "/offers"),
  ]);

  assert.equal(matchRedirect(table, "/old-blog/special")?.destination, "/offers");
  assert.equal(matchRedirect(table, "/old-blog/other")?.destination, "/blog/other");
});

test("an unsupported pattern is reported, never matched loosely", () => {
  const { rules, skipped } = buildRedirectMap([
    entry("/old/(.*)", "/new"),
    entry("/old/file-:id", "/new"),
  ]);

  assert.deepEqual(rules, []);
  assert.equal(skipped.length, 2);
  assert.match(skipped[0].reason, /unsupported pattern/);
});

test("a query-conditioned source matches only when the query is present", () => {
  const table = buildRedirectMap([
    entry("/old?ref=newsletter", "/welcome"),
    entry("/old", "/new"),
    entry("/flag?preview", "/preview"),
  ]);

  assert.equal(
    matchRedirect(table, "/old", query("ref=newsletter"))?.destination,
    "/welcome",
  );
  assert.equal(matchRedirect(table, "/old", query("ref=other"))?.destination, "/new");
  assert.equal(matchRedirect(table, "/old")?.destination, "/new");
  assert.equal(
    matchRedirect(table, "/flag", query("preview=1"))?.destination,
    "/preview",
  );
  assert.equal(matchRedirect(table, "/flag"), undefined);
});

test("a rule whose output leads straight back to the request is not served", () => {
  const table = buildRedirectMap([
    entry("/old-blog/:slug", "/blog/:slug"),
    entry("/blog/x", "/old-blog/x"),
  ]);

  assert.equal(matchRedirect(table, "/old-blog/x"), undefined);
});

// ── Rewrites ─────────────────────────────────────────────────────────────────

const rewrite = (source: string, destination: string) => ({ source, destination });

test("an exact rewrite serves an external file, with or without the trailing slash", () => {
  const { rewrites, skipped } = buildRewriteRules([
    rewrite("/some-file.pdf", "https://cdn.sanity.io/files/p/d/abc.pdf"),
  ]);

  assert.deepEqual(skipped, []);
  assert.equal(
    matchRewrite(rewrites, "/some-file.pdf"),
    "https://cdn.sanity.io/files/p/d/abc.pdf",
  );
  assert.equal(
    matchRewrite(rewrites, "/some-file.pdf/"),
    "https://cdn.sanity.io/files/p/d/abc.pdf",
  );
  assert.equal(matchRewrite(rewrites, "/other.pdf"), undefined);
});

test("a rewrite pattern fills an external destination", () => {
  const { rewrites } = buildRewriteRules([
    rewrite("/docs/:path*", "https://docs.example.com/:path*"),
  ]);

  assert.equal(
    matchRewrite(rewrites, "/docs/guides/setup"),
    "https://docs.example.com/guides/setup",
  );
  assert.equal(matchRewrite(rewrites, "/docs"), "https://docs.example.com");
});

test("rewrites match most specific first: query, then exact, then pattern", () => {
  const { rewrites } = buildRewriteRules([
    rewrite("/docs/:path*", "https://docs.example.com/:path*"),
    rewrite("/docs/pricing", "/pricing"),
    rewrite("/docs/pricing?plan=pro", "/pricing/pro"),
  ]);

  assert.equal(
    matchRewrite(rewrites, "/docs/pricing", query("plan=pro")),
    "/pricing/pro",
  );
  assert.equal(matchRewrite(rewrites, "/docs/pricing"), "/pricing");
  assert.equal(matchRewrite(rewrites, "/docs/faq"), "https://docs.example.com/faq");
});

test("a rewrite onto itself, a duplicate source and bad syntax are reported", () => {
  const { rewrites, skipped } = buildRewriteRules([
    rewrite("/about", "/about/"),
    rewrite("/file.pdf", "https://a.example.com/file.pdf"),
    rewrite("/file.pdf", "https://b.example.com/file.pdf"),
    rewrite("/old/(.*)", "/new"),
    rewrite("https://example.com/x", "/y"),
  ]);

  assert.deepEqual(rewrites, [rewrite("/file.pdf", "https://a.example.com/file.pdf")]);
  assert.deepEqual(
    skipped.map(({ source }) => source),
    ["/about", "/file.pdf", "/old/(.*)", "https://example.com/x"],
  );
});

test("a rewrite is never chained through a redirect or another rewrite", () => {
  const { rewrites } = buildRewriteRules([rewrite("/a", "/b"), rewrite("/b", "/c")]);

  assert.equal(matchRewrite(rewrites, "/a"), "/b");
});
