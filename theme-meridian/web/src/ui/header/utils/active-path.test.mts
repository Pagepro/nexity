// Run with `pnpm --filter @meridian/web test` (Node's built-in runner with
// `--experimental-strip-types`; no test framework dependency).
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findActivePath, isSelfOrDescendant, normalizePathname } from "./active-path.ts";

describe("normalizePathname", () => {
  it("drops the query, the hash and a trailing slash", () => {
    assert.equal(normalizePathname("/blog/?category=sales#top"), "/blog");
    assert.equal(normalizePathname("/case-studies/"), "/case-studies");
  });

  it("keeps the root as a slash", () => {
    assert.equal(normalizePathname("/"), "/");
    assert.equal(normalizePathname("/?ref=nav"), "/");
    assert.equal(normalizePathname(""), "/");
  });
});

describe("isSelfOrDescendant", () => {
  it("matches the page itself and the pages under it", () => {
    assert.equal(isSelfOrDescendant("/blog", "/blog"), true);
    assert.equal(isSelfOrDescendant("/blog", "/blog/a-post"), true);
    assert.equal(isSelfOrDescendant("/solutions", "/solutions/sales/emea"), true);
  });

  it("does not match a sibling that only shares the prefix", () => {
    assert.equal(isSelfOrDescendant("/blog", "/blogging"), false);
    assert.equal(isSelfOrDescendant("/case-studies", "/case-studies-archive"), false);
  });

  it("matches the home link on the home page only", () => {
    assert.equal(isSelfOrDescendant("/", "/"), true);
    assert.equal(isSelfOrDescendant("/", "/blog"), false);
  });
});

describe("findActivePath", () => {
  const MENU = ["/", "/features", "/blog", "/podcast", "/case-studies", "/pricing"];

  it("gives a detail page to its listing", () => {
    assert.equal(findActivePath(MENU, "/blog/what-500-b2b-sales-teams-told-us"), "/blog");
    assert.equal(findActivePath(MENU, "/podcast/why-champions-go-dark"), "/podcast");
    assert.equal(findActivePath(MENU, "/case-studies/nanodea-win-rate"), "/case-studies");
  });

  it("gives an exact page to its own link", () => {
    assert.equal(findActivePath(MENU, "/pricing"), "/pricing");
    assert.equal(findActivePath(MENU, "/"), "/");
  });

  it("prefers the most specific link when several match", () => {
    const nested = ["/solutions", "/solutions/sales"];

    assert.equal(findActivePath(nested, "/solutions/sales/emea"), "/solutions/sales");
    assert.equal(findActivePath(nested, "/solutions/marketing"), "/solutions");
  });

  it("returns null for a page in no menu section", () => {
    assert.equal(findActivePath(MENU, "/legal/privacy"), null);
  });

  it("skips links without a path", () => {
    assert.equal(findActivePath([null, "/blog"], "/blog/a-post"), "/blog");
  });
});
