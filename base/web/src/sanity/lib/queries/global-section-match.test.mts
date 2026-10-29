import assert from "node:assert/strict";
import test from "node:test";

import { appliesToSlug, isWildcard } from "./global-section-match.ts";

const scope = (path: string | null, excludePaths: (string | null)[] | null = null) => ({
  path,
  excludePaths,
});

test("a wildcard applies to every slug, the home page included", () => {
  assert.equal(appliesToSlug("/", scope("*")), true);
  assert.equal(appliesToSlug("blog/post", scope("*")), true);
  assert.equal(isWildcard(scope("*")), true);
});

test("a path applies to the slugs it prefixes, the parent included", () => {
  assert.equal(appliesToSlug("blog", scope("blog")), true);
  assert.equal(appliesToSlug("blog/post", scope("blog")), true);
  assert.equal(appliesToSlug("case-studies/x", scope("blog")), false);
});

test("a trailing slash leaves the parent out", () => {
  assert.equal(appliesToSlug("blog", scope("blog/")), false);
  assert.equal(appliesToSlug("blog/post", scope("blog/")), true);
});

test("an exclude path that prefixes the slug drops the document", () => {
  assert.equal(appliesToSlug("blog/post", scope("*", ["blog/"])), false);
  assert.equal(appliesToSlug("blog", scope("*", ["blog/"])), true);
  assert.equal(appliesToSlug("404", scope("*", ["404"])), false);
  assert.equal(appliesToSlug("blog/post", scope("blog", ["blog/post"])), false);
});

test("empty values match nothing and exclude nothing", () => {
  assert.equal(appliesToSlug("about", scope(null)), false);
  assert.equal(appliesToSlug("about", scope("*", [])), true);
  assert.equal(appliesToSlug("about", scope("*", [null])), true);
});
