import assert from "node:assert/strict";
import test from "node:test";

import { buildGraph, serializeGraph } from "./build-graph.ts";
import type { GraphDocument, SchemaGraph, SchemaNode, SiteSchemaData } from "./types.ts";

const BASE = "https://www.example.com/";
/** A run of four zero-width characters, the minimum `stegaClean` recognises as an encoding. */
const STEGA = "​‌‍﻿";

const site: SiteSchemaData = {
  name: "Example",
  seoTitle: null,
  description: null,
  headerLogoUrl: "https://cdn.sanity.io/images/x/logo.svg",
  legalName: null,
  alternateName: null,
  address: null,
  telephone: null,
  email: null,
  logoUrl: null,
  foundingDate: null,
  priceRange: null,
  localBusinessType: "LocalBusiness",
  sameAs: [],
  schemaDefaults: { post: "ItemPage", "blog-listing-page": "CollectionPage" },
};

const postDocument: GraphDocument = {
  type: "post",
  url: "https://www.example.com/blog/hello-world",
  title: "Hello world",
  pageName: "Hello world | Example",
  description: "The first post.",
  publishedAt: "2025-05-05T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  image: {
    url: "https://cdn.sanity.io/images/x/cover-1600x1000.jpg",
    width: 1600,
    height: 1000,
  },
  breadcrumb: [
    { name: "Home", url: "https://www.example.com/" },
    { name: "Blog", url: "https://www.example.com/blog" },
    { name: "Hello world", url: "https://www.example.com/blog/hello-world" },
  ],
  category: "Product updates",
  author: {
    id: "author-jane",
    name: "Jane Doe",
    role: "Head of Content",
    sameAs: ["https://www.linkedin.com/in/jane-doe"],
  },
};

const caseStudyDocument: GraphDocument = {
  ...postDocument,
  type: "case-study",
  url: "https://www.example.com/case-studies/acme",
  title: "How Acme grew",
  breadcrumb: [
    { name: "Home", url: "https://www.example.com/" },
    { name: "Case studies", url: "https://www.example.com/case-studies" },
    { name: "How Acme grew", url: "https://www.example.com/case-studies/acme" },
  ],
};

const homeDocument: GraphDocument = {
  type: "page",
  url: "https://www.example.com/",
  title: "Example: the platform",
  breadcrumb: [{ name: "Home", url: "https://www.example.com/" }],
};

const nodesOf = (graph: SchemaGraph | null) => graph?.["@graph"] ?? [];
const byType = (graph: SchemaGraph | null, type: string) =>
  nodesOf(graph).filter((node) =>
    Array.isArray(node["@type"]) ? node["@type"].includes(type) : node["@type"] === type,
  );

/** Every `{ "@id": x }` reference anywhere in the graph must name a node of the graph. */
const danglingReferences = (graph: SchemaGraph): string[] => {
  const ids = new Set(nodesOf(graph).map((node) => node["@id"]));
  const dangling: string[] = [];
  const walk = (value: unknown, isNode: boolean) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => walk(entry, false));
      return;
    }
    if (typeof value !== "object" || value === null) return;
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (
      !isNode &&
      keys.length === 1 &&
      keys[0] === "@id" &&
      typeof record["@id"] === "string"
    ) {
      if (!ids.has(record["@id"])) dangling.push(record["@id"]);
      return;
    }
    Object.values(record).forEach((entry) => walk(entry, false));
  };
  nodesOf(graph).forEach((node) => walk(node, true));
  return dangling;
};

test("a post yields organization, website, page, breadcrumb, image, article and person, all cross-linked", () => {
  const graph = buildGraph({ baseUrl: BASE, site, document: postDocument });
  assert.ok(graph);
  const types = nodesOf(graph).map((node) => node["@type"]);
  assert.deepEqual(types, [
    "Organization",
    "ImageObject",
    "WebSite",
    "ItemPage",
    "BreadcrumbList",
    "ImageObject",
    "Article",
    "Person",
  ]);
  assert.deepEqual(danglingReferences(graph), []);
  const article = byType(graph, "Article")[0];
  assert.deepEqual(article.author, {
    "@id": "https://www.example.com/#/schema/person/author-jane",
  });
  assert.deepEqual(article.image, {
    "@id": "https://www.example.com/blog/hello-world#primaryimage",
  });
  assert.deepEqual(byType(graph, "Person")[0].sameAs, [
    "https://www.linkedin.com/in/jane-doe",
  ]);
});

test("a case study also gets an Article and a Person; a page gets neither", () => {
  const caseStudyGraph = buildGraph({ baseUrl: BASE, site, document: caseStudyDocument });
  assert.ok(caseStudyGraph);
  assert.equal(byType(caseStudyGraph, "Article").length, 1);
  assert.equal(byType(caseStudyGraph, "Person").length, 1);
  assert.deepEqual(danglingReferences(caseStudyGraph), []);

  const pageGraph = buildGraph({ baseUrl: BASE, site, document: homeDocument });
  assert.ok(pageGraph);
  assert.equal(byType(pageGraph, "Article").length, 0);
  assert.equal(byType(pageGraph, "Person").length, 0);
  assert.deepEqual(danglingReferences(pageGraph), []);
});

test("a page carrying an author produces no Article: the mapping is by type, not by field presence", () => {
  const graph = buildGraph({
    baseUrl: BASE,
    site,
    document: { ...homeDocument, author: postDocument.author, publishedAt: "2025-01-01" },
  });
  assert.equal(byType(graph, "Article").length, 0);
  assert.equal(byType(graph, "Person").length, 0);
});

test("the WebPage name is the full <title>; the Article headline is the on-page name", () => {
  const graph = buildGraph({ baseUrl: BASE, site, document: postDocument });
  assert.equal(byType(graph, "ItemPage")[0].name, "Hello world | Example");
  assert.equal(byType(graph, "Article")[0].headline, "Hello world");
  const withoutPageName = buildGraph({
    baseUrl: BASE,
    site,
    document: { ...postDocument, pageName: null },
  });
  assert.equal(byType(withoutPageName, "ItemPage")[0].name, "Hello world");
});

test("every node has an @id; page-level ids derive from the page URL, site-level from the base URL", () => {
  const graph = buildGraph({ baseUrl: BASE, site, document: postDocument });
  for (const node of nodesOf(graph)) {
    assert.equal(typeof node["@id"], "string");
    assert.ok(node["@id"].length > 0);
  }
  const ids = nodesOf(graph).map((node) => node["@id"]);
  assert.ok(ids.includes("https://www.example.com/#organization"));
  assert.ok(ids.includes("https://www.example.com/#website"));
  assert.ok(ids.includes("https://www.example.com/blog/hello-world#webpage"));
  assert.ok(ids.includes("https://www.example.com/blog/hello-world#breadcrumb"));
  assert.ok(ids.includes("https://www.example.com/blog/hello-world#article"));
  assert.equal(new Set(ids).size, ids.length, "ids are unique");
});

test("null site data omits the organization and website nodes and keeps the page node", () => {
  const graph = buildGraph({ baseUrl: BASE, site: null, document: postDocument });
  assert.ok(graph);
  assert.equal(byType(graph, "Organization").length, 0);
  assert.equal(byType(graph, "WebSite").length, 0);
  const page = byType(graph, "WebPage")[0];
  assert.ok(page);
  assert.equal("isPartOf" in page, false);
  // With no organization but a person, the article's author is still the
  // person. With neither, the author is absent rather than dangling.
  assert.deepEqual(danglingReferences(graph), []);
  const orphan = buildGraph({
    baseUrl: BASE,
    site: null,
    document: { ...postDocument, author: null },
  });
  assert.ok(orphan);
  assert.equal("author" in byType(orphan, "Article")[0], false);
});

test("page type: the override wins, then the site default, then WebPage", () => {
  const overridden = buildGraph({
    baseUrl: BASE,
    site,
    document: { ...postDocument, schemaPageType: "AboutPage" },
  });
  assert.equal(byType(overridden, "AboutPage").length, 1);
  const inherited = buildGraph({ baseUrl: BASE, site, document: postDocument });
  assert.equal(byType(inherited, "ItemPage").length, 1);
  const fallback = buildGraph({ baseUrl: BASE, site, document: caseStudyDocument });
  assert.equal(byType(fallback, "WebPage").length, 1);
});

test("noIndex returns null; false returns a populated graph", () => {
  assert.equal(
    buildGraph({ baseUrl: BASE, site, document: { ...postDocument, noIndex: true } }),
    null,
  );
  assert.ok(
    (buildGraph({ baseUrl: BASE, site, document: { ...postDocument, noIndex: false } })?.[
      "@graph"
    ].length ?? 0) > 0,
  );
});

test("schemaArticleType none omits the article node and keeps the webpage", () => {
  const graph = buildGraph({
    baseUrl: BASE,
    site,
    document: { ...postDocument, schemaArticleType: "none" },
  });
  assert.equal(byType(graph, "Article").length, 0);
  assert.equal(byType(graph, "ItemPage").length, 1);
  assert.equal(byType(graph, "Person").length, 1);
  assert.ok(graph);
  assert.deepEqual(danglingReferences(graph), []);
});

test("stega characters never reach a node value", () => {
  const graph = buildGraph({
    baseUrl: BASE,
    site: { ...site, name: `Exam${STEGA}ple${STEGA}` },
    document: {
      ...postDocument,
      title: `Hello${STEGA} world`,
      category: `${STEGA}Product updates`,
      author: { id: "a", name: `Jane${STEGA} Doe` },
    },
  });
  const json = JSON.stringify(graph);
  assert.equal(json.includes("​"), false);
  assert.equal(byType(graph, "Article")[0].headline, "Hello world");
});

test("the breadcrumb: Home → Blog → title for a post, Home → Case studies → title for a case study, a single crumb at home", () => {
  const post = byType(
    buildGraph({ baseUrl: BASE, site, document: postDocument }),
    "BreadcrumbList",
  )[0];
  assert.deepEqual(
    (post.itemListElement as SchemaNode[]).map((item) => [item.name, item.item]),
    [
      ["Home", "https://www.example.com/"],
      ["Blog", "https://www.example.com/blog"],
      ["Hello world", undefined],
    ],
  );
  const caseStudy = byType(
    buildGraph({ baseUrl: BASE, site, document: caseStudyDocument }),
    "BreadcrumbList",
  )[0];
  assert.deepEqual(
    (caseStudy.itemListElement as SchemaNode[]).map((item) => item.name),
    ["Home", "Case studies", "How Acme grew"],
  );
  const home = byType(
    buildGraph({ baseUrl: BASE, site, document: homeDocument }),
    "BreadcrumbList",
  )[0];
  assert.equal((home.itemListElement as SchemaNode[]).length, 1);
});

test("a base URL with a trailing slash and one without produce the same site ids", () => {
  const withSlash = buildGraph({
    baseUrl: "https://www.example.com/",
    site,
    document: homeDocument,
  });
  const without = buildGraph({
    baseUrl: "https://www.example.com",
    site,
    document: homeDocument,
  });
  assert.deepEqual(
    nodesOf(withSlash).map((node) => node["@id"]),
    nodesOf(without).map((node) => node["@id"]),
  );
});

test("serializeGraph escapes the characters that could close the script element", () => {
  const graph = buildGraph({
    baseUrl: BASE,
    site,
    document: {
      ...homeDocument,
      title: "Home </script><script>alert(1)</script> & more",
    },
  });
  assert.ok(graph);
  const json = serializeGraph(graph);
  assert.equal(json.includes("<"), false);
  assert.equal(json.includes(">"), false);
  assert.equal(json.includes("&"), false);
  const parsed = JSON.parse(json) as SchemaGraph;
  assert.equal(parsed["@context"], "https://schema.org");
  assert.equal(
    (parsed["@graph"].find((node) => node["@type"] === "WebPage") as SchemaNode).name,
    "Home </script><script>alert(1)</script> & more",
  );
});
