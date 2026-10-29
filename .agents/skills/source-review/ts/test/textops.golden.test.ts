/**
 * Golden checks for the text helpers.
 *
 * The file reads `fixtures/golden/fuzzy.json` and `fixtures/golden/policy.json`,
 * which hold the answers of the Python implementation. The port passes when it
 * returns the same answers.
 *
 * `docs/PORT-CONTRACT.md` states the tolerance. The anchor method and the
 * matched text must match. The score may differ, because `rapidfuzz` and this
 * implementation compute it differently.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { canonicalUrl, findAnchor, quoteIsInPage } from "../src/textops.js";
import { ratio } from "../src/fuzzy.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDEN_DIR = join(HERE, "..", "..", "fixtures", "golden");

function golden<T>(name: string): T {
  return JSON.parse(readFileSync(join(GOLDEN_DIR, name), "utf-8")) as T;
}

interface AnchorRow {
  claim: string;
  method: string;
  span: { start: number; end: number } | null;
  matched_text: string | null;
  score_at_least: number;
}
interface QuoteRow {
  quote: string;
  accepted: boolean;
}
interface VersionRow {
  claim: string;
  page: string;
  in_scope: boolean;
}
interface FuzzyGolden {
  anchor_article: string;
  anchors: AnchorRow[];
  quote_page: string;
  quotes: QuoteRow[];
  version_scope: VersionRow[];
}
interface PolicyGolden {
  rows: { url: string; canonical_url: string }[];
}

describe("claim anchor", () => {
  const data = golden<FuzzyGolden>("fuzzy.json");

  it.each(data.anchors.map((row, index) => [index, row] as const))(
    "probe %i keeps the Python method",
    (_index, row) => {
      const result = findAnchor(data.anchor_article, row.claim);
      expect(result.method).toBe(row.method);
    },
  );

  it.each(data.anchors.filter((row) => row.matched_text !== null).map((row) => [row] as const))(
    "locates the same text for %o",
    (row) => {
      const result = findAnchor(data.anchor_article, row.claim);
      expect(result.span).not.toBeNull();
      const matched = data.anchor_article.slice(result.span!.start, result.span!.end);
      expect(matched).toBe(row.matched_text);
      expect(result.score).toBeGreaterThanOrEqual(row.score_at_least);
    },
  );

  it("covers every anchor method", () => {
    const methods = new Set(data.anchors.map((row) => row.method));
    expect(methods).toEqual(new Set(["exact", "normalized", "fuzzy", "not_found"]));
  });
});

describe("quote gate", () => {
  const data = golden<FuzzyGolden>("fuzzy.json");

  it.each(data.quotes.map((row, index) => [index, row] as const))(
    "probe %i keeps the Python decision",
    (_index, row) => {
      expect(quoteIsInPage(row.quote, data.quote_page)).toBe(row.accepted);
    },
  );

  it("still refuses an invented sentence", () => {
    expect(quoteIsInPage("The board cancelled the release in Reykjavik.", data.quote_page)).toBe(
      false,
    );
  });
});

describe("canonical url", () => {
  const rows = golden<PolicyGolden>("policy.json").rows;

  it("matches the Python form for every corpus address", () => {
    const wrong: string[] = [];
    for (const row of rows) {
      const actual = canonicalUrl(row.url);
      if (actual !== row.canonical_url) {
        wrong.push(`${row.url}\n  python: ${row.canonical_url}\n  node:   ${actual}`);
      }
    }
    expect(wrong, `${wrong.length} addresses differ:\n${wrong.slice(0, 5).join("\n")}`).toEqual([]);
  });
});

describe("ratio", () => {
  it("returns 100 for equal strings", () => {
    expect(ratio("abc", "abc")).toBe(100);
  });

  it("returns 0 for strings with nothing in common", () => {
    expect(ratio("abc", "xyz")).toBe(0);
  });

  it("returns 100 for two empty strings", () => {
    expect(ratio("", "")).toBe(100);
  });
});
