// Run with `pnpm --filter @meridian/web test` (Node's built-in runner with
// `--experimental-strip-types`; no test framework dependency).
import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Exact relative path with its extension: the stripper does no tsconfig path mapping,
// so `@/` is unavailable in a `.mts` test.
import { hasLinkTarget, internalPathHref, opensInNewTab } from "./utils.ts";

describe("opensInNewTab", () => {
  it("opens an external page in a new tab", () => {
    assert.equal(opensInNewTab("https://www.example.com/company/"), true);
    assert.equal(opensInNewTab("http://example.com"), true);
  });

  it("keeps a mailto and a tel in the same tab", () => {
    // The mail client or the dialler takes over. A new tab stays behind, blank.
    assert.equal(opensInNewTab("mailto:hello@example.com"), false);
    assert.equal(opensInNewTab("tel:+14155550123"), false);
  });

  it("keeps an internal destination in the same tab", () => {
    assert.equal(opensInNewTab("/services/tax"), false);
    assert.equal(opensInNewTab("#faq"), false);
    assert.equal(opensInNewTab(""), false);
  });
});

describe("internalPathHref", () => {
  it("returns the typed path as-is, with no trailing slash", () => {
    assert.equal(internalPathHref("/contact"), "/contact");
    assert.equal(internalPathHref("/contact#form"), "/contact#form");
  });

  it("appends the URL parameters", () => {
    assert.equal(internalPathHref("/blog", "?category=news"), "/blog?category=news");
    assert.equal(internalPathHref("/contact", "#form"), "/contact#form");
  });

  it("returns an empty string when there is no path", () => {
    assert.equal(internalPathHref(null, "#form"), "");
    assert.equal(internalPathHref("   "), "");
  });
});

describe("hasLinkTarget", () => {
  it("is true for a link with a destination", () => {
    assert.equal(hasLinkTarget({ type: "internal", internal: { _type: "page" } }), true);
    assert.equal(hasLinkTarget({ type: "path", internalPath: "/contact" }), true);
    assert.equal(
      hasLinkTarget({ type: "external", external: "https://example.com" }),
      true,
    );
    assert.equal(
      hasLinkTarget({ type: "download", file: { asset: { url: "https://cdn/x.pdf" } } }),
      true,
    );
  });

  it("is false for a link whose destination was cleared in Studio", () => {
    assert.equal(hasLinkTarget({ type: "internal", internal: null }), false);
    assert.equal(hasLinkTarget({ type: "path", internalPath: "  " }), false);
    assert.equal(hasLinkTarget({ type: "external" }), false);
    assert.equal(hasLinkTarget({ type: "download", file: { asset: null } }), false);
  });

  it("is false for no link, or a destination of another type", () => {
    assert.equal(hasLinkTarget(null), false);
    assert.equal(
      hasLinkTarget({ type: "internal", external: "https://example.com" }),
      false,
    );
  });
});
