import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSeoDescription,
  buildSeoTitle,
  FALLBACK_SITE_TITLE,
  resolveSeoTitle,
  resolveSiteTitle,
  withSiteTitle,
} from "@nexity/studio/seo-title";

const SITE = { title: "Acme", seo: { title: "Acme Co", description: "Site default" } };

test("resolveSeoTitle: seoTitle > metadata.title > document title > empty", () => {
  assert.equal(resolveSeoTitle({ seoTitle: "SEO", title: "H1" }, "Doc"), "SEO");
  assert.equal(resolveSeoTitle({ seoTitle: "  ", title: "H1" }, "Doc"), "H1");
  assert.equal(resolveSeoTitle({ seoTitle: null, title: null }, "Doc"), "Doc");
  assert.equal(resolveSeoTitle(null, " Doc "), "Doc");
  assert.equal(resolveSeoTitle(undefined), "");
});

test("resolveSiteTitle: site.seo.title > site.title > fallback", () => {
  assert.equal(resolveSiteTitle(SITE), "Acme Co");
  assert.equal(resolveSiteTitle({ title: "Acme", seo: { title: " " } }), "Acme");
  assert.equal(resolveSiteTitle({ title: null, seo: null }), FALLBACK_SITE_TITLE);
  assert.equal(resolveSiteTitle(null), FALLBACK_SITE_TITLE);
});

test("withSiteTitle appends the brand once", () => {
  assert.equal(withSiteTitle("About", "Acme"), "About | Acme");
  assert.equal(withSiteTitle("Acme", "Acme"), "Acme");
  assert.equal(withSiteTitle("About Acme | Experts", "Acme"), "About Acme | Experts");
  assert.equal(withSiteTitle("Acmeish things", "Acme"), "Acmeish things | Acme");
  assert.equal(withSiteTitle("  ", "Acme"), "Acme");
  assert.equal(withSiteTitle(null, "Acme"), "Acme");
});

test("withSiteTitle escapes regex characters in the brand", () => {
  assert.equal(withSiteTitle("Hi", "A+B (x)"), "Hi | A+B (x)");
  assert.equal(withSiteTitle("Hi A+B (x)", "A+B (x)"), "Hi A+B (x)");
});

test("buildSeoTitle composes precedence and suffix", () => {
  assert.equal(
    buildSeoTitle({ metadata: { seoTitle: "Search title", title: "H1" }, site: SITE }),
    "Search title | Acme Co",
  );
  assert.equal(
    buildSeoTitle({ metadata: { title: "H1" }, documentTitle: "Doc", site: SITE }),
    "H1 | Acme Co",
  );
  assert.equal(
    buildSeoTitle({ metadata: null, documentTitle: "Doc", site: null }),
    `Doc | ${FALLBACK_SITE_TITLE}`,
  );
  assert.equal(buildSeoTitle({ metadata: {}, site: SITE }), "Acme Co");
});

test("buildSeoDescription: metadata > excerpt > site default", () => {
  assert.equal(
    buildSeoDescription({ metadataDescription: "Meta", excerpt: "Ex", site: SITE }),
    "Meta",
  );
  assert.equal(
    buildSeoDescription({ metadataDescription: " ", excerpt: "Ex", site: SITE }),
    "Ex",
  );
  assert.equal(buildSeoDescription({ site: SITE }), "Site default");
  assert.equal(buildSeoDescription({ site: null }), "");
});
