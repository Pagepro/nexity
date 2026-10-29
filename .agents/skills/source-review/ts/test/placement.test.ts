/**
 * Checks for the placement advice.
 *
 * The advice must follow from the run, not from the mood of the reader. Two
 * editors reading two reports place the same source the same way.
 */

import { describe, expect, it } from "vitest";

import {
  anchorPhrase,
  brandOf,
  isWeakForCitation,
  Placement,
  placementFor,
  QUOTE_BLOCK_CONFIDENCE,
} from "../src/placement.js";
import { SourceType } from "../src/models.js";

const base = {
  claimText: "The tool accepts a pasted code snippet.",
  requiredValues: [] as string[],
  sourceType: SourceType.OFFICIAL_DOCS,
  domain: "developers.google.com",
  pageTitle: "Site Moves | Google Search Central",
  confidence: 0.9,
  denied: false,
};

describe("the brand of a host", () => {
  it("drops the section label and the suffix", () => {
    expect(brandOf("developers.google.com")).toBe("google");
    expect(brandOf("support.google.com")).toBe("google");
    expect(brandOf("docs.cypress.io")).toBe("cypress");
    expect(brandOf("nextjs.org")).toBe("nextjs");
    expect(brandOf("www.w3.org")).toBe("w3");
  });

  it("survives a host with no label to drop", () => {
    expect(brandOf("")).toBe("");
    expect(brandOf("vercel.com")).toBe("vercel");
  });
});

describe("the anchor phrase", () => {
  it("runs from the brand through the verb", () => {
    const claim = "Google officially recommends keeping 301 redirects active for at least 180 days.";
    expect(anchorPhrase(claim, "google")).toBe("Google officially recommends");
  });

  it("returns nothing when the sentence never names the source", () => {
    expect(anchorPhrase("Recovery typically takes four to six weeks.", "google")).toBe("");
  });
});

describe("the placement rule", () => {
  it("asks for a rewrite before a link when a page denies the claim", () => {
    const advice = placementFor({ ...base, denied: true });
    expect(advice.placement).toBe(Placement.REWRITE_FIRST);
    expect(advice.anchor).toBe("");
    expect(advice.note).toContain("look checked");
  });

  it("puts a number under the sentence, never inside it", () => {
    const advice = placementFor({ ...base, requiredValues: ["180"], confidence: 0.8 });
    expect(advice.placement).toBe(Placement.SOURCE_LINE);
  });

  it("earns the quote when a number meets a confident source", () => {
    const advice = placementFor({
      ...base,
      requiredValues: ["180"],
      confidence: QUOTE_BLOCK_CONFIDENCE,
    });
    expect(advice.placement).toBe(Placement.QUOTE_BLOCK);
  });

  it("links the phrase that names the source when the sentence names it", () => {
    const advice = placementFor({
      ...base,
      claimText: "Google officially recommends keeping the redirects active.",
    });
    expect(advice.placement).toBe(Placement.INLINE);
    expect(advice.anchor).toBe("Google officially recommends");
  });

  it("falls back to a plain inline link", () => {
    const advice = placementFor({ ...base, claimText: "A redirect passes the ranking value." });
    expect(advice.placement).toBe(Placement.INLINE);
    expect(advice.anchor).toBe("");
  });

  it("names the page and the host for the source line", () => {
    expect(placementFor(base).sourceName).toBe("Site Moves (developers.google.com)");
  });

  it("falls back to the host when the page states no title", () => {
    expect(placementFor({ ...base, pageTitle: "" }).sourceName).toBe("developers.google.com");
  });

  it("marks a fallback source as one to name in the text", () => {
    expect(isWeakForCitation(SourceType.GENERAL_WEB)).toBe(true);
    expect(isWeakForCitation(SourceType.OFFICIAL_DOCS)).toBe(false);
  });
});

describe("a number that the search list drops", () => {
  it("still counts as a number for the placement", () => {
    // `requiredValuesOf` drops a bare integer, so the claim about 180 days
    // reached the report with an empty list and read as if it carried no
    // number at all.
    const advice = placementFor({
      ...base,
      claimText:
        "Google officially recommends keeping 301 redirects active for at least 180 days.",
      requiredValues: [],
      confidence: 0.95,
    });
    expect(advice.placement).toBe(Placement.QUOTE_BLOCK);
  });

  it("still reads a sentence with no number as one", () => {
    const advice = placementFor({
      ...base,
      claimText: "A permanent redirect passes the ranking value.",
      requiredValues: [],
    });
    expect(advice.placement).toBe(Placement.INLINE);
  });
});

describe("a sentence that already carries a link", () => {
  // Two live migration articles linked the very page that the run proposed.
  it("asks for no second link when the article links to the source", () => {
    const advice = placementFor({
      ...base,
      existingLinks: ["https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes"],
    });
    expect(advice.placement).toBe(Placement.ALREADY_LINKED);
    expect(advice.note).toContain("already links to this source");
  });

  it("asks for a comparison when the sentence links somewhere else", () => {
    const advice = placementFor({ ...base, existingLinks: ["https://seo-blog.example/guide"] });
    expect(advice.placement).not.toBe(Placement.ALREADY_LINKED);
    expect(advice.note).toContain("seo-blog.example");
    expect(advice.note).toContain("Compare the two");
  });

  it("still asks for a rewrite when an official page denies the claim", () => {
    const advice = placementFor({
      ...base,
      denied: true,
      existingLinks: ["https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes"],
    });
    expect(advice.placement).toBe(Placement.REWRITE_FIRST);
  });
});
