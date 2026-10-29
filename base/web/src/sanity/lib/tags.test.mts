import assert from "node:assert/strict";
import test from "node:test";

import { GLOBAL_TAG, SITEMAP_TAG, requestTagFor, tagsForDocumentType } from "./tags.ts";

test("a content-only edit purges the document's own route and the sitemap", () => {
  assert.deepEqual(tagsForDocumentType("page", "about", { contentOnly: true }), [
    "page:about",
    SITEMAP_TAG,
  ]);
  assert.deepEqual(tagsForDocumentType("post", "hello", { contentOnly: true }), [
    "post:hello",
    SITEMAP_TAG,
  ]);
  assert.deepEqual(
    tagsForDocumentType("podcast-episode", "ep-1", { contentOnly: true }),
    ["podcast-episode:ep-1", SITEMAP_TAG],
  );
});

test("any other edit keeps the type-wide purge other documents rely on", () => {
  assert.deepEqual(tagsForDocumentType("page", "about"), ["page", "page:about"]);
  assert.deepEqual(tagsForDocumentType("case-study", "acme"), [
    "case-study",
    "case-study:acme",
  ]);
});

test("content-only never narrows a document without a route of its own", () => {
  assert.deepEqual(tagsForDocumentType("page", null, { contentOnly: true }), ["page"]);
  assert.deepEqual(tagsForDocumentType("header", null, { contentOnly: true }), [
    "header",
  ]);
  assert.deepEqual(tagsForDocumentType("testimonial", null, { contentOnly: true }), [
    GLOBAL_TAG,
  ]);
});

test("the request tag skips slug-scoped cache tags", () => {
  assert.equal(requestTagFor(["page", "page:about"]), "page");
  assert.equal(requestTagFor(["page:about"]), undefined);
  assert.equal(requestTagFor(undefined), undefined);
});
