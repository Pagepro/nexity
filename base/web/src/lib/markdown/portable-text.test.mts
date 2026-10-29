import assert from "node:assert/strict";
import test from "node:test";

import {
  leadingHeading,
  portableTextToMarkdown,
  portableTextToPlainText,
} from "./portable-text.ts";
import { testContext } from "./test-context.ts";

let keyCounter = 0;
const span = (text: string, marks: string[] = []) => ({
  _type: "span",
  _key: `s${(keyCounter += 1)}`,
  text,
  marks,
});
const block = (
  children: ReturnType<typeof span>[],
  extra: Record<string, unknown> = {},
) => ({
  _type: "block",
  _key: `b${(keyCounter += 1)}`,
  style: "normal",
  children,
  markDefs: [],
  ...extra,
});

const render = (value: unknown[]) => portableTextToMarkdown(value, testContext);

test("styles map to the heading tags RichText renders; # is reserved", () => {
  const markdown = render([
    block([span("One")], { style: "heading-1" }),
    block([span("Two")], { style: "heading-2" }),
    block([span("Three")], { style: "heading-3" }),
    block([span("Section xl")], { style: "section-heading-xl" }),
    block([span("Section md")], { style: "section-heading-md" }),
    block([span("Section sm")], { style: "section-heading-sm" }),
    block([span("Alt one")], { style: "alt-heading-1" }),
    block([span("Body")], { style: "body-3" }),
  ]);
  assert.equal(
    markdown,
    "## One\n\n## Two\n\n### Three\n\n## Section xl\n\n### Section md\n\n#### Section sm\n\n## Alt one\n\nBody",
  );
});

test("decorators merge across spans and keep whitespace outside the markers", () => {
  const markdown = render([
    block([
      span("Plain "),
      span("bold ", ["strong"]),
      span("bold italic", ["strong", "em"]),
      span(" end", []),
      span(" gone", ["strike-through"]),
      span(" under", ["underline"]),
    ]),
  ]);
  assert.equal(markdown, "Plain **bold *bold italic*** end ~~gone~~ under");
});

test("links: every link type, grouped spans, and a link with no URL", () => {
  const markDefs = [
    {
      _key: "internal",
      _type: "link",
      type: "internal",
      internal: { _type: "post", metadata: { slug: { current: "hello" } } },
      params: "#top",
    },
    {
      _key: "path",
      _type: "link",
      type: "path",
      internalPath: "/contact",
      params: "?a=1",
    },
    {
      _key: "external",
      _type: "link",
      type: "external",
      external: "https://other.com/x",
    },
    {
      _key: "download",
      _type: "link",
      type: "download",
      file: { asset: { url: "https://cdn/x.pdf" } },
    },
    { _key: "broken", _type: "link", type: "internal", internal: null },
    { _key: "color", _type: "simplerColor", value: "#f00" },
  ];
  const markdown = render([
    block(
      [
        span("a post", ["internal"]),
        span(", "),
        span("contact ", ["path"]),
        span("us", ["path", "strong"]),
        span(", "),
        span("site", ["external"]),
        span(", "),
        span("pdf", ["download"]),
        span(", "),
        span("nowhere", ["broken"]),
        span(" red", ["color"]),
      ],
      { markDefs },
    ),
  ]);
  assert.equal(
    markdown,
    "[a post](https://example.com/post/hello#top), [contact **us**](https://example.com/contact?a=1), [site](https://other.com/x), [pdf](https://cdn/x.pdf), nowhere red",
  );
});

test("nested and mixed lists, numbering restarts per list", () => {
  const markdown = render([
    block([span("First")], { listItem: "number", level: 1 }),
    block([span("Nested bullet")], { listItem: "bullet", level: 2 }),
    block([span("Deeper")], { listItem: "bullet", level: 3 }),
    block([span("Second")], { listItem: "number", level: 1 }),
    block([span("Between")]),
    block([span("Again one")], { listItem: "number", level: 1 }),
  ]);
  assert.equal(
    markdown,
    "1. First\n   - Nested bullet\n     - Deeper\n2. Second\n\nBetween\n\n1. Again one",
  );
});

test("custom blocks: image alt, pullquote, callout, code, table, video, checklist", () => {
  const markdown = render([
    { _type: "img", _key: "i1", alt: "A chart", url: "https://cdn/x.png" },
    { _type: "img", _key: "i2", image: { asset: { altText: "Asset alt" } } },
    { _type: "img", _key: "i3", alt: "" },
    {
      _type: "img",
      _key: "i4",
      role: "decorative",
      alt: "Ignored",
      image: { asset: { altText: "Ignored" } },
    },
    { _type: "pullquote", _key: "p", quote: "Ship it.", author: "Ada", role: "CTO" },
    {
      _type: "callout",
      _key: "c",
      content: [block([span("Heads up")])],
      cta: { link: { type: "path", internalPath: "/start", label: "Start" } },
    },
    {
      _type: "code",
      _key: "k",
      code: "const a = 1;\n",
      language: "ts",
      filename: "a.ts",
    },
    {
      _type: "table",
      _key: "t",
      rows: [{ cells: ["Plan", "Price"] }, { cells: ["Pro", "$1 | mo"] }],
    },
    { _type: "videoEmbed", _key: "v", url: "https://youtu.be/x", caption: "Demo" },
    {
      _type: "checklist",
      _key: "l",
      items: [
        { tone: "do", title: "Measure", description: "every deal" },
        { tone: "dont", title: "Guess", description: null },
      ],
    },
    { _type: "unknownThing", _key: "u", text: "ignored" },
  ]);
  assert.equal(
    markdown,
    [
      "[Image: A chart]",
      "[Image: Asset alt]",
      "> Ship it.\n>\n> — Ada, CTO",
      "> Heads up\n>\n> [Start](https://example.com/start)",
      "`a.ts`\n\n```ts\nconst a = 1;\n```",
      "| Plan | Price |\n| --- | --- |\n| Pro | $1 \\| mo |",
      "[Video: Demo](https://youtu.be/x)",
      "- Do: **Measure**: every deal\n- Don't: **Guess**",
    ].join("\n\n"),
  );
});

test("text that looks like Markdown is escaped; hard breaks are kept", () => {
  assert.equal(
    render([block([span("# not a heading *really*")])]),
    "\\# not a heading \\*really\\*",
  );
  assert.equal(render([block([span("line one\nline two")])]), "line one  \nline two");
});

test("empty input, empty blocks and the skipped block", () => {
  assert.equal(render([]), "");
  assert.equal(portableTextToMarkdown(null, testContext), "");
  assert.equal(render([block([span("   ")])]), "");

  const value = [
    block([span("Title")], { _key: "promoted", style: "heading-1" }),
    block([span("Body")]),
  ];
  assert.equal(
    portableTextToMarkdown(value, { ...testContext, skipBlockKey: "promoted" }),
    "Body",
  );
});

test("leadingHeading and plain text", () => {
  const value = [
    block([span("Big title")], { _key: "h", style: "section-heading-lg" }),
    block([span("Body")]),
  ];
  assert.equal(leadingHeading(value), null);
  assert.deepEqual(leadingHeading(value, { anyLevel: true }), {
    key: "h",
    text: "Big title",
  });
  assert.deepEqual(
    leadingHeading([block([span("H1")], { _key: "one", style: "heading-1" })]),
    { key: "one", text: "H1" },
  );
  assert.equal(leadingHeading([block([span("Body")])], { anyLevel: true }), null);
  assert.equal(portableTextToPlainText(value), "Big title\nBody");
});
