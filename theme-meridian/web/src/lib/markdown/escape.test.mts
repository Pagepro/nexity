import assert from "node:assert/strict";
import test from "node:test";

import {
  cleanText,
  escapeMarkdown,
  escapeTableCell,
  escapeUrl,
  yamlString,
} from "./escape.ts";

test("escapeMarkdown: inline syntax is escaped", () => {
  assert.equal(
    escapeMarkdown("a *b* [c](d) `e` <f> \\g"),
    "a \\*b\\* \\[c\\](d) \\`e\\` \\<f> \\\\g",
  );
});

test("escapeMarkdown: underscores only outside words", () => {
  assert.equal(escapeMarkdown("snake_case stays"), "snake_case stays");
  assert.equal(escapeMarkdown("_lead and trail_"), "\\_lead and trail\\_");
});

test("escapeMarkdown: block markers only at line starts that would start a block", () => {
  assert.equal(escapeMarkdown("# not a heading"), "\\# not a heading");
  assert.equal(escapeMarkdown("#hashtag"), "#hashtag");
  assert.equal(escapeMarkdown("- not a list"), "\\- not a list");
  assert.equal(escapeMarkdown("-20% faster"), "-20% faster");
  assert.equal(escapeMarkdown("1. not a list"), "1\\. not a list");
  assert.equal(escapeMarkdown("2026 was good"), "2026 was good");
  assert.equal(escapeMarkdown("> quote"), "\\> quote");
  assert.equal(escapeMarkdown("a - b"), "a - b");
});

test("cleanText: strips stega and trims; non-strings become empty", () => {
  // A stega payload is a run of invisible characters appended to the string.
  assert.equal(
    cleanText("  Hello\u200b\u200c\u200d\ufeff\u200b\u200c\u200d\ufeff  "),
    "Hello",
  );
  assert.equal(cleanText(null), "");
  assert.equal(cleanText(42), "");
});

test("table cell, URL and YAML escaping", () => {
  assert.equal(escapeTableCell("a | b\nc"), "a \\| b c");
  assert.equal(escapeUrl("https://x.com/a b(c)"), "https://x.com/a%20b%28c%29");
  assert.equal(yamlString('He said "hi": yes'), '"He said \\"hi\\": yes"');
});
