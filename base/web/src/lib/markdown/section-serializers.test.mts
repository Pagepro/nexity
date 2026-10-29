import assert from "node:assert/strict";
import test from "node:test";

import {
  SECTION_FIXTURES,
  SECTION_TYPES,
} from "../../ui/styleguide/sections-gallery/fixtures-registry.ts";

import {
  SECTION_MARKDOWN_SERIALIZERS,
  sectionsToMarkdown,
} from "./section-serializers.ts";
import { testContext } from "./test-context.ts";

type Section = Parameters<typeof sectionsToMarkdown>[0][number];

const render = (...sections: unknown[]) =>
  sectionsToMarkdown(sections as Section[], testContext);

const block = (text: string, style = "normal", key = text) => ({
  _type: "block",
  _key: key,
  style,
  markDefs: [],
  children: [{ _type: "span", _key: `${key}-span`, text, marks: [] }],
});

test("every section type has an entry, and only shared-section-ref is null", () => {
  assert.deepEqual(
    Object.keys(SECTION_MARKDOWN_SERIALIZERS).sort(),
    [...SECTION_TYPES].sort(),
  );
  const nulls = Object.entries(SECTION_MARKDOWN_SERIALIZERS)
    .filter(([, serializer]) => serializer === null)
    .map(([type]) => type);
  assert.deepEqual(nulls, ["shared-section-ref"]);
});

test("every gallery fixture serializes to non-empty Markdown without throwing", () => {
  for (const [type, fixture] of Object.entries(SECTION_FIXTURES)) {
    const markdown = render(fixture);
    assert.ok(markdown.trim().length > 0, `${type} produced no Markdown`);
    assert.doesNotMatch(
      markdown,
      /undefined|null|\[object Object\]/,
      `${type} leaked a value`,
    );
    assert.doesNotMatch(markdown, /\n{3,}/, `${type} has a double blank line`);
  }
});

test("fixtures: the text a visitor sees is in the Markdown", () => {
  const expectations: Record<string, string[]> = {
    hero: [
      "## Stop guessing why you lose deals",
      "[Start free trial](https://example.com)",
    ],
    faq: [
      "### Do I need to write any code to update content?",
      "No. Every section is editable",
    ],
    pricing: [
      "### Pro (Most popular)",
      "Monthly: $29 /mo · Yearly: $290 /mo",
      "- Custom domains",
    ],
    "comparison-table": [
      "| Feature | Starter | Growth | Enterprise |",
      "| Price | $49 /mo | $249 /mo | Custom |",
      "Available as an add-on (Add-on)",
    ],
    "impact-calculator": [
      "[Interactive calculator",
      "Sales team size: 40 reps",
      "~1 month",
    ],
    "integrations-grid": ["**CRM**: Salesforce, HubSpot"],
    testimonials: ["— Maya Chen, Head of Marketing, Northwind"],
    "logos-carousel": ["Logos: Partner logo 1"],
    "trust-badges": ["- SOC 2 Type II"],
    stats: ["- **99.99%** Uptime across all regions"],
    "contact-form": ["[Contact form; fields: Full name"],
    "blog-listing": ["## Latest articles", "[All articles](https://example.com/blog)"],
    "podcast-listing": ["## Every conversation, by topic."],
    "shared-section-ref": ["## One bundle, every page"],
  };

  for (const [type, snippets] of Object.entries(expectations)) {
    const markdown = render(SECTION_FIXTURES[type as keyof typeof SECTION_FIXTURES]);
    for (const snippet of snippets) {
      assert.ok(
        markdown.includes(snippet),
        `${type} is missing: ${snippet}\n---\n${markdown}`,
      );
    }
  }
});

test("hidden sections are skipped, unknown types ignored, a throwing serializer loses only itself", () => {
  const visible = {
    _type: "text-block",
    _key: "a",
    content: [block("Visible")],
    ctas: null,
  };
  const hidden = {
    ...visible,
    _key: "b",
    options: { hidden: true },
    content: [block("Hidden")],
  };
  const unknown = { _type: "not-a-section", _key: "c" };
  const broken = {
    _type: "faq",
    _key: "d",
    get items(): unknown {
      throw new Error("bad data");
    },
  };
  const last = { ...visible, _key: "e", content: [block("Last")] };

  const originalError = console.error;
  console.error = () => {};
  try {
    assert.equal(render(visible, hidden, unknown, broken, last), "Visible\n\nLast");
  } finally {
    console.error = originalError;
  }
});

test("shared sections are flattened in place", () => {
  const ref = {
    _type: "shared-section-ref",
    _key: "ref",
    sharedSections: [
      {
        sections: [
          { _type: "text-block", _key: "x", content: [block("Inside")], ctas: null },
        ],
      },
    ],
  };
  const after = { _type: "text-block", _key: "y", content: [block("After")], ctas: null };
  assert.equal(render(ref, after), "Inside\n\nAfter");
});

test("layouts that hide content in HTML hide it here too", () => {
  const stats = {
    _type: "stats",
    _key: "s",
    layout: "band",
    content: [block("Not shown in the band")],
    stats: [{ _key: "1", value: "3x", label: "faster" }],
  };
  assert.equal(render(stats), "- **3x** faster");

  const testimonials = {
    _type: "testimonials",
    _key: "t",
    layout: "featured",
    pretitle: "Hidden pretitle",
    content: [block("Hidden heading")],
    testimonials: [
      { _id: "1", author: "Ada", role: null, company: "Acme", quote: [block("First")] },
      { _id: "2", author: "Bob", role: null, company: null, quote: [block("Second")] },
    ],
  };
  assert.equal(render(testimonials), "> First\n>\n> — Ada, Acme");

  const emptyFaq = { _type: "faq", _key: "f", content: [block("FAQ")], items: [] };
  assert.equal(render(emptyFaq), "");

  const image = (alt: string) => ({ _key: alt, alt, image: { asset: { _id: alt } } });
  const featureBlock = (imageLayout: string | null) => ({
    _type: "feature-block",
    _key: "b",
    imageLayout,
    content: [block("Ship faster")],
    ctas: [
      {
        _key: "c",
        link: { type: "external", external: "https://example.com", label: "Go" },
      },
    ],
    images: [image("First"), image("Second")],
  });
  assert.equal(
    render(featureBlock("single")),
    "Ship faster\n\n- [Go](https://example.com)\n\n[Image: First]",
  );
  assert.ok(render(featureBlock("grid")).endsWith("[Image: First]\n\n[Image: Second]"));
  assert.ok(!render(featureBlock(null)).includes("[Image:"));
});

test("listing sections list every injected item with absolute URLs", () => {
  const posts = [
    {
      _id: "p1",
      title: "Hello world",
      slug: "hello-world",
      category: "Win/loss",
      publishedAt: "2026-05-22T10:00:00Z",
      author: { firstName: "Ada", lastName: "Lovelace" },
      excerpt: "An excerpt.",
    },
  ];
  assert.equal(
    render({ _type: "blog-listing", _key: "b", perPage: 6, posts }),
    "## Latest articles\n\n- [Hello world](https://example.com/post/hello-world)\n  Win/loss · 22 May, 2026 · By Ada Lovelace\n  An excerpt.",
  );
});

test("pricing without a yearly price shows the single price only", () => {
  const pricing = {
    _type: "pricing",
    _key: "p",
    plans: [
      {
        _key: "1",
        name: "Team",
        monthlyPrice: "$10",
        yearlyPrice: null,
        priceSuffix: "/mo",
        features: ["A"],
      },
    ],
  };
  assert.equal(render(pricing), "### Team\n\n$10 /mo\n\n- A");
});
