import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getSectionThemeClassName, isSectionTheme } from "./section-theme.ts";

describe("getSectionThemeClassName", () => {
  it("returns undefined for an unset theme, so the section keeps its design surface", () => {
    assert.equal(getSectionThemeClassName(undefined), undefined);
    assert.equal(getSectionThemeClassName(null), undefined);
    assert.equal(getSectionThemeClassName(""), undefined);
  });

  it("paints Light explicitly and switches off the section's own surface", () => {
    const className = getSectionThemeClassName("light") ?? "";

    assert.match(className, /\bsection-themed\b/);
    assert.match(className, /\bbg-background\b/);
    assert.doesNotMatch(className, /\bdark\b/);
  });

  it("paints Dark with the .dark palette and switches off the section's own surface", () => {
    const className = getSectionThemeClassName("dark") ?? "";

    assert.match(className, /\bsection-themed\b/);
    assert.match(className, /(^|\s)dark(\s|$)/);
    assert.match(className, /\bbg-background\b/);
  });

  it("ignores a value the schema does not list", () => {
    assert.equal(getSectionThemeClassName("muted"), undefined);
    assert.equal(getSectionThemeClassName("toString"), undefined);
  });
});

describe("isSectionTheme", () => {
  it("accepts only the listed themes", () => {
    assert.equal(isSectionTheme("light"), true);
    assert.equal(isSectionTheme("dark"), true);
    assert.equal(isSectionTheme("Dark"), false);
    assert.equal(isSectionTheme(1), false);
  });
});
