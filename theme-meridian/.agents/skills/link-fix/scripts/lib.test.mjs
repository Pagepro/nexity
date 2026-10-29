import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyTrailingSlash,
  buildOwnHosts,
  checkAbsoluteUrl,
  checkInternalPath,
  checkSlug,
  detectTrailingSlash,
  isLocalHost,
  parseOwnUrl,
  parseSitePath,
  planPatches,
  rewriteValue,
  scanDocuments,
  summarize,
  upgradeHttp,
} from "./lib.mjs";

const ownHosts = buildOwnHosts(["https://www.example.com", "old-example.com"]);

const documents = [
  { _id: "pricing", _type: "page", _rev: "r1", metadata: { slug: { current: "pricing" } } },
  { _id: "about", _type: "page", _rev: "r1", metadata: { slug: { current: "/about/" } } },
  { _id: "home", _type: "page", _rev: "r1", metadata: { slug: { current: "/" } } },
  { _id: "post-a", _type: "post", _rev: "r1", metadata: { slug: { current: "Hello-World" } } },
  {
    _id: "landing",
    _type: "page",
    _rev: "r7",
    metadata: { slug: { current: "landing" }, canonical: "http://example.com/landing/" },
    sections: [
      {
        _key: "s1",
        _type: "hero",
        ctas: [
          { _key: "c1", _type: "cta", link: { _type: "link", type: "external", external: "http://www.example.com/pricing/?plan=pro" } },
          { _key: "c2", _type: "cta", link: { _type: "link", type: "external", external: "http://partner.com/docs" } },
          { _key: "c3", _type: "cta", link: { _type: "link", type: "path", internalPath: "Pricing/" } },
          { _key: "c4", _type: "cta", link: { _type: "link", type: "external", external: "mailto:hi@example.com" } },
          { _key: "c5", _type: "cta", link: { _type: "link", type: "external", external: "http://localhost:3000/x" } },
        ],
      },
    ],
    body: [
      {
        _key: "b1",
        _type: "block",
        children: [{ _key: "t1", _type: "span", text: "see http://example.com/pricing", marks: ["m1"] }],
        markDefs: [{ _key: "m1", _type: "link", type: "external", external: "/pricing#faq" }],
      },
    ],
    sameAs: ["http://linkedin.com/company/example"],
  },
];

const scan = (trailingSlash = "never") => scanDocuments(documents, { ownHosts, trailingSlash }).findings;
const find = (findings, rule, patchPath) =>
  findings.find((finding) => finding.rule === rule && finding.patchPath === patchPath && finding.documentId === "landing") ??
  findings.find((finding) => finding.rule === rule && finding.patchPath === patchPath);

describe("URL helpers", () => {
  it("parses own-domain URLs with www, http and protocol-relative forms", () => {
    assert.deepEqual(parseOwnUrl("http://www.example.com/pricing/?plan=pro#top", ownHosts), {
      path: "/pricing",
      params: "?plan=pro#top",
    });
    assert.deepEqual(parseOwnUrl("//old-example.com", ownHosts), { path: "/", params: "" });
    assert.equal(parseOwnUrl("https://partner.com/pricing", ownHosts), null);
  });

  it("reads a site path typed into an external field", () => {
    assert.deepEqual(parseSitePath("/pricing/#faq"), { path: "/pricing", params: "#faq" });
    assert.equal(parseSitePath("//cdn.example.com/x"), null);
    assert.equal(parseSitePath("#top"), null);
  });

  it("upgrades only http:// and leaves other schemes alone", () => {
    assert.equal(upgradeHttp("http://partner.com/a?b=1"), "https://partner.com/a?b=1");
    assert.equal(upgradeHttp("HTTP://partner.com"), "https://partner.com");
    for (const value of ["https://partner.com", "mailto:a@b.c", "tel:+48123", "#top", "/x"])
      assert.equal(upgradeHttp(value), null);
  });

  it("recognises local and private hosts", () => {
    for (const host of ["localhost", "app.localhost", "site.local", "x.test", "10.0.0.1", "[::1]"])
      assert.equal(isLocalHost(host), true, host);
    assert.equal(isLocalHost("example.com"), false);
  });
});

describe("trailing-slash convention", () => {
  it("reads trailingSlash from next.config", () => {
    assert.equal(detectTrailingSlash("export default { trailingSlash: true }"), "always");
    assert.equal(detectTrailingSlash("export default { trailingSlash: false }"), "never");
    assert.equal(detectTrailingSlash("export default {}"), "never");
    assert.equal(detectTrailingSlash(undefined), "never");
  });

  it("applies the convention but never to the root or to files", () => {
    assert.equal(applyTrailingSlash("/pricing/", "never"), "/pricing");
    assert.equal(applyTrailingSlash("/pricing", "always"), "/pricing/");
    assert.equal(applyTrailingSlash("/", "always"), "/");
    assert.equal(applyTrailingSlash("/llms.txt", "always"), "/llms.txt");
  });
});

describe("checkInternalPath", () => {
  const names = (result) => result.issues.map((item) => item.name);

  it("fixes leading, double and trailing slashes and keeps the query", () => {
    const result = checkInternalPath(" pricing//plans/?a=1", "never");
    assert.deepEqual(names(result), ["whitespace", "missing leading slash", "double slash", "trailing slash"]);
    assert.equal(result.fixed, "/pricing/plans?a=1");
  });

  it("adds the slash when the site uses trailingSlash: true", () => {
    assert.equal(checkInternalPath("/pricing#faq", "always").fixed, "/pricing/#faq");
  });

  it("passes a clean path", () => {
    assert.deepEqual(checkInternalPath("/pricing", "never"), { issues: [], fixed: "/pricing" });
    assert.deepEqual(checkInternalPath("/", "always"), { issues: [], fixed: "/" });
  });

  it("reports what it cannot fix safely", () => {
    for (const value of ["https://example.com/x", "//example.com/x", "/a b", "#faq"]) {
      const result = checkInternalPath(value, "never");
      assert.equal(result.fixed, null, value);
      assert.equal(result.issues.every((item) => !item.fixable), true, value);
    }
  });
});

describe("checkAbsoluteUrl", () => {
  it("keeps the origin text and the query", () => {
    assert.equal(checkAbsoluteUrl("https://Example.com//a/b/?x=1", "never").fixed, "https://Example.com/a/b?x=1");
    assert.equal(checkAbsoluteUrl("https://example.com/a", "always").fixed, "https://example.com/a/");
  });

  it("never flags the site root", () => {
    assert.deepEqual(checkAbsoluteUrl("https://example.com/", "never").issues, []);
    assert.deepEqual(checkAbsoluteUrl("https://example.com", "always").issues, []);
  });
});

describe("checkSlug", () => {
  it("strips slashes from page slugs and keeps the home slug", () => {
    assert.equal(checkSlug("page", "/about/").fixed, "about");
    assert.equal(checkSlug("page", "services//web").fixed, "services/web");
    assert.deepEqual(checkSlug("page", "/").issues, []);
    assert.deepEqual(checkSlug("page", "services/web").issues, []);
  });

  it("reports changes to a live URL instead of fixing them", () => {
    const result = checkSlug("post", "Hello World");
    assert.equal(result.issues.length, 2);
    assert.equal(result.issues.every((item) => !item.fixable), true);
    assert.equal(checkSlug("post", "a/b").issues[0].fixable, false);
  });
});

describe("scanDocuments", () => {
  const findings = scan();

  it("finds own-domain links, including a site path in an external field", () => {
    const cta = find(findings, "own-domain", "sections[_key==\"s1\"].ctas[_key==\"c1\"].link");
    assert.equal(cta.status, "document");
    assert.equal(cta.target._id, "pricing");
    assert.equal(cta.params, "?plan=pro");

    const annotation = find(findings, "own-domain", "body[_key==\"b1\"].markDefs[_key==\"m1\"]");
    assert.equal(annotation.kind, "richText link");
    assert.equal(annotation.params, "#faq");
    assert.match(annotation.note, /site path/);

    const canonical = find(findings, "own-domain", "metadata.canonical");
    assert.equal(canonical.convertible, false);
  });

  it("finds http:// in links and url fields, not in span text, mailto or local hosts", () => {
    const http = findings.filter((finding) => finding.rule === "http");
    assert.deepEqual(
      http.map((finding) => [finding.host, finding.fixable]).sort(),
      [
        ["example.com", true],
        ["linkedin.com", true],
        ["localhost", false],
        ["partner.com", true],
        ["www.example.com", true],
      ],
    );
    assert.equal(find(findings, "http", "sameAs[0]").kind, "page.sameAs[]");
  });

  it("finds slash issues in paths, own-domain URLs and slugs", () => {
    const path = find(findings, "slash", "sections[_key==\"s1\"].ctas[_key==\"c3\"].link.internalPath");
    assert.equal(path.suggested, "/pricing");
    assert.match(path.issue, /uppercase/);
    assert.equal(path.fixable, true);

    assert.equal(find(findings, "slash", "metadata.canonical").suggested, "http://example.com/landing");

    const slugs = findings.filter((finding) => finding.rule === "slash" && finding.fieldType === "slug");
    assert.deepEqual(
      slugs.map((finding) => [finding.documentId, finding.suggested, finding.fixable]),
      [
        ["about", "about", true],
        ["post-a", "Hello-World", false],
      ],
    );
  });

  it("counts every rule in one table", () => {
    const summary = summarize(findings);
    assert.equal(summary.total, findings.length);
    assert.deepEqual([...new Set(summary.table.map((row) => row.rule))], ["own-domain", "http", "slash"]);
    assert.equal(summary.httpHosts["partner.com"], 1);
  });
});

describe("planPatches", () => {
  const findings = scan();

  it("lets the own-domain conversion win over http and slash fixes of the same link", () => {
    const { patches } = planPatches(findings, { rules: ["own-domain", "http", "slash"] });
    const landing = patches.find((patch) => patch.documentId === "landing");
    const base = "sections[_key==\"s1\"].ctas[_key==\"c1\"].link";
    assert.equal(landing.set[`${base}.type`], "internal");
    assert.equal(landing.set[`${base}.external`], undefined);
    assert.ok(landing.unset.includes(`${base}.external`));
    assert.equal(landing.set["metadata.canonical"], "https://example.com/landing");
    assert.equal(landing.set["sections[_key==\"s1\"].ctas[_key==\"c2\"].link.external"], "https://partner.com/docs");
    assert.equal(landing.set["sameAs[0]"], "https://linkedin.com/company/example");
  });

  it("upgrades an own-domain link to https when only the http rule is picked", () => {
    const { patches } = planPatches(findings, { rules: ["http"] });
    const landing = patches.find((patch) => patch.documentId === "landing");
    assert.equal(
      landing.set["sections[_key==\"s1\"].ctas[_key==\"c1\"].link.external"],
      "https://www.example.com/pricing/?plan=pro",
    );
    assert.equal(landing.set["sections[_key==\"s1\"].ctas[_key==\"c5\"].link.external"], undefined);
  });

  it("writes converted paths in the site's trailing-slash convention", () => {
    const { patches } = planPatches(scan("always"), { rules: ["own-domain"], mode: "path", trailingSlash: "always" });
    const landing = patches.find((patch) => patch.documentId === "landing");
    assert.equal(landing.set["sections[_key==\"s1\"].ctas[_key==\"c1\"].link.internalPath"], "/pricing/");
  });

  it("skips kept hosts, unverified https, report-only issues and release versions", () => {
    const http = findings.filter((finding) => finding.rule === "http" && finding.host === "partner.com");
    assert.equal(planPatches(http, { rules: ["http"], keepHttp: new Set(["partner.com"]) }).skipped.length, 1);
    assert.equal(planPatches(http, { rules: ["http"], verifyHttps: true }).skipped.length, 1);
    const verified = http.map((finding) => ({ ...finding, https: { ok: true, status: 200 } }));
    assert.equal(planPatches(verified, { rules: ["http"], verifyHttps: true }).patches.length, 1);

    const slug = findings.find((finding) => finding.documentId === "post-a");
    assert.match(planPatches([slug], { rules: ["slash"] }).skipped[0].reason, /report only/);

    const version = { ...http[0], variant: "version" };
    assert.match(planPatches([version], { rules: ["http"] }).skipped[0].reason, /release version/);
  });

  it("counts every finding a patch resolves, superseded ones included", () => {
    const selected = findings.filter((finding) => finding.documentId === "landing");
    const { patches, skipped } = planPatches(selected, { rules: ["own-domain", "http", "slash"] });
    const resolved = patches.reduce((sum, patch) => sum + patch.resolves, 0);
    assert.equal(resolved + skipped.length, selected.length);
  });
});

describe("rewriteValue", () => {
  it("combines the http upgrade and the slash fix on one URL", () => {
    assert.equal(
      rewriteValue("http://example.com/a/", [{ rule: "slash", fieldType: "url" }, { rule: "http" }], "never"),
      "https://example.com/a",
    );
  });
});
