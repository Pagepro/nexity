import assert from "node:assert/strict";
import test from "node:test";

import {
  buildArticleNode,
  buildBreadcrumbNode,
  buildImageNode,
  buildOrganizationNode,
  buildPersonNode,
  buildWebPageNode,
  buildWebSiteNode,
  faqAnswerText,
  normalizeSameAs,
  normalizeSiteSchema,
  readSiteSchema,
  resolveArticleType,
  resolvePageType,
} from "./build-graph.ts";
import type { GraphDocument, SiteSchemaData } from "./types.ts";

const BASE = "https://www.example.com";
/** A run of four zero-width characters, the minimum `stegaClean` recognises as an encoding. */
const STEGA = "​‌‍﻿";
const PAGE_URL = "https://www.example.com/about";

const site = (overrides: Partial<SiteSchemaData> = {}): SiteSchemaData => ({
  name: "Example",
  seoTitle: "Example",
  description: "The example platform.",
  headerLogoUrl: "https://cdn.sanity.io/images/x/header-logo.svg",
  legalName: "Example Inc.",
  alternateName: null,
  address: {
    streetAddress: "1 Main St, Suite 200",
    addressLocality: "Springfield",
    addressRegion: "IL",
    postalCode: "62701",
    addressCountry: "US",
  },
  telephone: "+1-555-010-0000",
  email: null,
  logoUrl: "https://cdn.sanity.io/images/x/logo-512x512.png",
  foundingDate: "2013-01-01",
  priceRange: "$$",
  localBusinessType: "ProfessionalService",
  sameAs: ["https://www.linkedin.com/company/example"],
  schemaDefaults: {},
  ...overrides,
});

const document = (overrides: Partial<GraphDocument> = {}): GraphDocument => ({
  type: "page",
  url: PAGE_URL,
  title: "About",
  description: "Who we are.",
  breadcrumb: [
    { name: "Home", url: `${BASE}/` },
    { name: "About", url: PAGE_URL },
  ],
  ...overrides,
});

// --- Organization ---------------------------------------------------------------

test("an address and a telephone together upgrade the organization to the chosen subtype", () => {
  const node = buildOrganizationNode(BASE, site());
  assert.equal(node?.["@type"], "ProfessionalService");
  assert.equal(node?.["@id"], "https://www.example.com/#organization");
  assert.equal(node?.name, "Example Inc.");
  assert.equal(node?.priceRange, "$$");
  assert.deepEqual(node?.address, {
    "@type": "PostalAddress",
    streetAddress: "1 Main St, Suite 200",
    addressLocality: "Springfield",
    addressRegion: "IL",
    postalCode: "62701",
    addressCountry: "US",
  });
});

test("a missing telephone keeps a plain Organization, and priceRange stays off it", () => {
  const node = buildOrganizationNode(BASE, site({ telephone: null }));
  assert.equal(node?.["@type"], "Organization");
  assert.equal("priceRange" in (node ?? {}), false);
});

test("a missing address keeps a plain Organization", () => {
  const node = buildOrganizationNode(BASE, site({ address: null }));
  assert.equal(node?.["@type"], "Organization");
  assert.equal("address" in (node ?? {}), false);
});

test("the subtype 'none' (or unset) keeps a plain Organization even with full contact data", () => {
  assert.equal(
    buildOrganizationNode(BASE, site({ localBusinessType: "none" }))?.["@type"],
    "Organization",
  );
  assert.equal(
    buildOrganizationNode(BASE, site({ localBusinessType: null }))?.["@type"],
    "Organization",
  );
});

test("the site title and the header logo are the fallbacks for name and logo", () => {
  const node = buildOrganizationNode(BASE, site({ legalName: null, logoUrl: null }));
  assert.equal(node?.name, "Example");
  assert.deepEqual(node?.logo, { "@id": "https://www.example.com/#logo" });
});

test("no name at all means no organization node", () => {
  assert.equal(buildOrganizationNode(BASE, site({ legalName: null, name: null })), null);
});

test("an empty sameAs is omitted rather than emitted as []", () => {
  const node = buildOrganizationNode(BASE, site({ sameAs: [] }));
  assert.equal("sameAs" in (node ?? {}), false);
});

// --- Site data --------------------------------------------------------------------

test("sameAs keeps only absolute http(s) URLs, drops blanks, and keeps the order", () => {
  assert.deepEqual(
    normalizeSameAs([
      " https://x.com/example ",
      "",
      null,
      "linkedin.com/company/example",
      "mailto:hello@example.com",
      "http://facebook.com/example",
    ]),
    ["https://x.com/example", "http://facebook.com/example"],
  );
});

test("normalizeSiteSchema maps the camel-cased defaults back onto the routed type names", () => {
  const data = normalizeSiteSchema({
    title: "Example",
    seo: { title: "Example", description: "Default description." },
    structuredData: {
      schemaDefaults: {
        caseStudy: "ItemPage",
        blogListingPage: "CollectionPage",
        caseStudiesListingPage: "CollectionPage",
        page: "WebPage",
      },
      localBusinessType: "not-a-type",
    },
  });
  assert.equal(data.schemaDefaults["case-study"], "ItemPage");
  assert.equal(data.schemaDefaults["blog-listing-page"], "CollectionPage");
  assert.equal(data.schemaDefaults["case-studies-listing-page"], "CollectionPage");
  assert.equal(data.schemaDefaults.page, "WebPage");
  assert.equal(data.schemaDefaults.post, null);
  assert.equal(data.localBusinessType, null);
  assert.equal(data.seoTitle, "Example");
  assert.equal(data.description, "Default description.");
});

test("readSiteSchema returns null when the fetch rejects", async () => {
  assert.equal(await readSiteSchema(() => Promise.reject(new Error("network"))), null);
});

test("readSiteSchema returns null when no site document exists", async () => {
  assert.equal(await readSiteSchema(() => Promise.resolve(null)), null);
});

// --- Page type ----------------------------------------------------------------------

test("the document override wins, then the site default, then WebPage", () => {
  assert.equal(resolvePageType("AboutPage", "ItemPage"), "AboutPage");
  assert.equal(resolvePageType(null, "ItemPage"), "ItemPage");
  assert.equal(resolvePageType(undefined, undefined), "WebPage");
});

test("a value outside the vocabulary falls through instead of being emitted", () => {
  assert.equal(resolvePageType("MedicalWebPage", "ItemPage"), "ItemPage");
  assert.equal(resolvePageType("MedicalWebPage", "Nonsense"), "WebPage");
});

test("stega characters are cleaned before the page type is compared", () => {
  assert.equal(resolvePageType(`Contact${STEGA}Page${STEGA}`, null), "ContactPage");
});

test("the article type defaults to Article and honours none", () => {
  assert.equal(resolveArticleType(null), "Article");
  assert.equal(resolveArticleType("BlogPosting"), "BlogPosting");
  assert.equal(resolveArticleType("none"), "none");
  assert.equal(resolveArticleType("Recipe"), "Article");
});

// --- WebSite / WebPage ----------------------------------------------------------------

test("the website node names the organization as publisher when there is one", () => {
  const organization = buildOrganizationNode(BASE, site());
  const node = buildWebSiteNode(BASE, site(), organization);
  assert.equal(node["@id"], "https://www.example.com/#website");
  assert.equal(node.url, "https://www.example.com/");
  assert.equal(node.name, "Example");
  assert.deepEqual(node.publisher, { "@id": "https://www.example.com/#organization" });
  assert.equal("publisher" in buildWebSiteNode(BASE, site(), null), false);
});

test("the webpage node derives its ids from the page URL and links what exists", () => {
  const organization = buildOrganizationNode(BASE, site());
  const website = buildWebSiteNode(BASE, site(), organization);
  const breadcrumb = buildBreadcrumbNode(PAGE_URL, document().breadcrumb);
  const image = buildImageNode(PAGE_URL, {
    url: "https://cdn.sanity.io/images/x/about-1200x800.jpg",
    width: 1200,
    height: 800,
  });
  const node = buildWebPageNode(
    BASE,
    document({ createdAt: "2026-01-02T00:00:00Z", updatedAt: "2026-02-03T00:00:00Z" }),
    {
      pageType: "AboutPage",
      website,
      organization,
      breadcrumb,
      image,
      questionIds: [],
    },
  );
  assert.equal(node["@type"], "AboutPage");
  assert.equal(node["@id"], `${PAGE_URL}#webpage`);
  assert.deepEqual(node.isPartOf, { "@id": "https://www.example.com/#website" });
  assert.deepEqual(node.breadcrumb, { "@id": `${PAGE_URL}#breadcrumb` });
  assert.deepEqual(node.primaryImageOfPage, { "@id": `${PAGE_URL}#primaryimage` });
  assert.equal(node.datePublished, "2026-01-02T00:00:00Z");
  assert.equal(node.dateModified, "2026-02-03T00:00:00Z");
  assert.equal("mainEntity" in node, false);
  assert.equal("about" in node, false);
});

test("a webpage with FAQ questions gains FAQPage and lists them as mainEntity", () => {
  const node = buildWebPageNode(BASE, document(), {
    pageType: "WebPage",
    website: null,
    organization: null,
    breadcrumb: null,
    image: null,
    questionIds: [`${PAGE_URL}#faq-a`, `${PAGE_URL}#faq-b`],
  });
  assert.deepEqual(node["@type"], ["WebPage", "FAQPage"]);
  assert.deepEqual(node.mainEntity, [
    { "@id": `${PAGE_URL}#faq-a` },
    { "@id": `${PAGE_URL}#faq-b` },
  ]);
  assert.equal("isPartOf" in node, false);
});

test("an FAQPage with questions does not double the type", () => {
  const node = buildWebPageNode(BASE, document(), {
    pageType: "FAQPage",
    website: null,
    organization: null,
    breadcrumb: null,
    image: null,
    questionIds: [`${PAGE_URL}#faq-a`],
  });
  assert.equal(node["@type"], "FAQPage");
});

test("the homepage is about the organization", () => {
  const organization = buildOrganizationNode(BASE, site());
  const node = buildWebPageNode(BASE, document({ url: `${BASE}/`, breadcrumb: [] }), {
    pageType: "WebPage",
    website: null,
    organization,
    breadcrumb: null,
    image: null,
    questionIds: [],
  });
  assert.deepEqual(node.about, { "@id": "https://www.example.com/#organization" });
});

// --- Breadcrumb -------------------------------------------------------------------------

test("the breadcrumb lists positions in order and the last crumb has no item", () => {
  const node = buildBreadcrumbNode(PAGE_URL, document().breadcrumb);
  assert.equal(node?.["@id"], `${PAGE_URL}#breadcrumb`);
  assert.deepEqual(node?.itemListElement, [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.example.com/" },
    { "@type": "ListItem", position: 2, name: "About" },
  ]);
});

test("an empty trail yields no breadcrumb node", () => {
  assert.equal(buildBreadcrumbNode(PAGE_URL, []), null);
});

// --- Image ------------------------------------------------------------------------------

test("an image without a url yields no node; dimensions and alt come along when present", () => {
  assert.equal(buildImageNode(PAGE_URL, null), null);
  assert.equal(buildImageNode(PAGE_URL, { url: "" }), null);
  const node = buildImageNode(PAGE_URL, {
    url: "https://cdn/x.jpg",
    width: 10,
    height: 5,
    alt: "The team",
  });
  assert.equal(node?.width, 10);
  assert.equal(node?.caption, "The team");
});

// --- Article / Person ------------------------------------------------------------------

const webPage = { "@type": "WebPage", "@id": `${PAGE_URL}#webpage` };

test("the article maps publishedAt to datePublished and _updatedAt to dateModified", () => {
  const node = buildArticleNode(
    document({
      type: "post",
      publishedAt: "2025-05-05T00:00:00Z",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      category: "Product updates",
    }),
    {
      articleType: "BlogPosting",
      webPage,
      organization: null,
      person: null,
      image: null,
    },
  );
  assert.equal(node?.["@type"], "BlogPosting");
  assert.equal(node?.datePublished, "2025-05-05T00:00:00Z");
  assert.equal(node?.dateModified, "2026-01-01T00:00:00Z");
  assert.deepEqual(node?.articleSection, ["Product updates"]);
  assert.deepEqual(node?.mainEntityOfPage, { "@id": `${PAGE_URL}#webpage` });
  assert.equal("author" in (node ?? {}), false);
});

test("an article type of none omits the article node", () => {
  assert.equal(
    buildArticleNode(document({ type: "post" }), {
      articleType: "none",
      webPage,
      organization: null,
      person: null,
      image: null,
    }),
    null,
  );
});

test("the author is the Person when there is one, otherwise the Organization", () => {
  const organization = buildOrganizationNode(BASE, site());
  const person = buildPersonNode(BASE, {
    id: "author-1",
    name: "Jane Doe",
    role: "Head of Content",
  });
  const withPerson = buildArticleNode(document({ type: "post" }), {
    articleType: "Article",
    webPage,
    organization,
    person,
    image: null,
  });
  assert.deepEqual(withPerson?.author, {
    "@id": "https://www.example.com/#/schema/person/author-1",
  });
  assert.deepEqual(withPerson?.publisher, {
    "@id": "https://www.example.com/#organization",
  });
  const withoutPerson = buildArticleNode(document({ type: "post" }), {
    articleType: "Article",
    webPage,
    organization,
    person: null,
    image: null,
  });
  assert.deepEqual(withoutPerson?.author, {
    "@id": "https://www.example.com/#organization",
  });
});

test("a person without an avatar or profiles omits image and sameAs; without a name there is no person", () => {
  const node = buildPersonNode(BASE, {
    id: "a",
    name: "Jane Doe",
    role: "Head of Content",
    imageUrl: null,
    sameAs: [null, "not a url"],
  });
  assert.equal(node?.jobTitle, "Head of Content");
  assert.equal("image" in (node ?? {}), false);
  assert.equal("sameAs" in (node ?? {}), false);
  assert.equal(buildPersonNode(BASE, { id: "a", name: null }), null);
  assert.equal(buildPersonNode(BASE, null), null);
});

// --- FAQ answer text ---------------------------------------------------------------------

test("a multi-paragraph answer keeps its paragraphs and drops link markup", () => {
  assert.equal(
    faqAnswerText(
      "First line with [a link](https://example.com/x) here.\n\n  Second   line.\n",
    ),
    "First line with a link here.\nSecond line.",
  );
  assert.equal(faqAnswerText("   "), null);
});
