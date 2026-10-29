import assert from "node:assert/strict";
import test from "node:test";

import {
  SECTION_SCHEMA_CONTRIBUTORS,
  buildGraph,
  collectSectionNodes,
  flattenSharedSections,
} from "./build-graph.ts";
import type { GraphDocument, SchemaGraph } from "./types.ts";

const PAGE_URL = "https://www.example.com/";

const document: GraphDocument = {
  type: "page",
  url: PAGE_URL,
  title: "Home",
  breadcrumb: [{ name: "Home", url: PAGE_URL }],
};

const faqSection = (
  key: string,
  items: { _key: string; question: string; answer: string }[],
) => ({
  _type: "faq",
  _key: key,
  pretitle: "FAQ",
  items,
});

const questionsOf = (graph: SchemaGraph | null) =>
  (graph?.["@graph"] ?? []).filter((node) => node["@type"] === "Question");

test("one faq section yields one Question per item, keyed by the item's _key", () => {
  const graph = buildGraph({
    baseUrl: PAGE_URL,
    site: null,
    document,
    sections: [
      { _type: "hero", _key: "h" },
      faqSection("f1", [
        { _key: "a", question: "Q1?", answer: "A1." },
        { _key: "b", question: "Q2?", answer: "A2." },
        { _key: "c", question: "Q3?", answer: "A3." },
      ]),
    ],
  });
  const questions = questionsOf(graph);
  assert.equal(questions.length, 3);
  assert.deepEqual(
    questions.map((node) => node["@id"]),
    [`${PAGE_URL}#faq-a`, `${PAGE_URL}#faq-b`, `${PAGE_URL}#faq-c`],
  );
  assert.deepEqual(questions[0].acceptedAnswer, { "@type": "Answer", text: "A1." });
  const page = graph?.["@graph"].find((node) => node["@id"] === `${PAGE_URL}#webpage`);
  assert.deepEqual(page?.["@type"], ["WebPage", "FAQPage"]);
});

test("two faq sections contribute both lists without @id collisions", () => {
  const graph = buildGraph({
    baseUrl: PAGE_URL,
    site: null,
    document,
    sections: [
      faqSection("f1", [{ _key: "a", question: "Q1?", answer: "A1." }]),
      faqSection("f2", [{ _key: "b", question: "Q2?", answer: "A2." }]),
    ],
  });
  const ids = questionsOf(graph).map((node) => node["@id"]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
});

test("a page with no faq section produces no FAQ nodes and stays a plain WebPage", () => {
  const graph = buildGraph({
    baseUrl: PAGE_URL,
    site: null,
    document,
    sections: [
      { _type: "hero", _key: "h" },
      { _type: "stats", _key: "s" },
      { _type: "testimonials", _key: "t" },
    ],
  });
  assert.equal(questionsOf(graph).length, 0);
  const page = graph?.["@graph"].find((node) => node["@id"] === `${PAGE_URL}#webpage`);
  assert.equal(page?.["@type"], "WebPage");
});

test("a faq inside a shared-section bundle counts, because the ref is flattened first", () => {
  const graph = buildGraph({
    baseUrl: PAGE_URL,
    site: null,
    document,
    sections: [
      {
        _type: "shared-section-ref",
        _key: "ref",
        // The shape SECTIONS_QUERY projects: bundles dereferenced inline.
        sharedSections: [
          {
            _id: "sharedSectionGeneralFaq",
            sections: [
              faqSection("inner", [{ _key: "x", question: "Q?", answer: "A." }]),
            ],
          },
          null,
          { _id: "emptyBundle", sections: null },
        ],
      },
    ],
  });
  assert.equal(questionsOf(graph).length, 1);
});

test("flattenSharedSections keeps order and drops malformed bundle entries", () => {
  const flattened = flattenSharedSections([
    { _type: "hero", _key: "h" },
    {
      _type: "shared-section-ref",
      _key: "ref",
      sharedSections: [
        { sections: [{ _type: "stats", _key: "s" }, null, "text", { _key: "no-type" }] },
        { sections: [{ _type: "faq", _key: "f" }] },
      ],
    },
    null,
    { _type: "cta-banner", _key: "c" },
  ]);
  assert.deepEqual(
    flattened.map((section) => section._type),
    ["hero", "stats", "faq", "cta-banner"],
  );
});

test("a section type mapped to null contributes nothing and does not throw; neither does an unknown type", () => {
  const nullMapped = Object.entries(SECTION_SCHEMA_CONTRIBUTORS)
    .filter(([, contributor]) => contributor === null)
    .map(([type]) => ({ _type: type, _key: type }));
  assert.ok(nullMapped.length > 0);
  assert.deepEqual(collectSectionNodes(PAGE_URL, nullMapped), []);
  assert.deepEqual(
    collectSectionNodes(PAGE_URL, [{ _type: "not-a-section", _key: "n" }, null]),
    [],
  );
});

test("a faq section with malformed items skips them instead of throwing", () => {
  const nodes = collectSectionNodes(PAGE_URL, [
    {
      _type: "faq",
      _key: "f",
      items: [
        null,
        "text",
        { question: "no key" },
        { _key: "ok", question: "Q?", answer: "A." },
      ],
    },
    { _type: "faq", _key: "g", items: "not an array" },
  ]);
  assert.equal(nodes.length, 1);
});

test("a multi-paragraph answer is serialized as text without markup artifacts", () => {
  const [node] = collectSectionNodes(PAGE_URL, [
    faqSection("f", [
      {
        _key: "m",
        question: "How?",
        answer: "Start with [the guide](/docs/start).\n\nThen email hello@example.com.",
      },
    ]),
  ]);
  assert.equal(
    (node.acceptedAnswer as { text: string }).text,
    "Start with the guide.\nThen email hello@example.com.",
  );
});
