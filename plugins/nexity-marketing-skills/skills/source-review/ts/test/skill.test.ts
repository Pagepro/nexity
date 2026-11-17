/**
 * Checks for the skill layer: the dates, the brain reader, and the report.
 *
 * The verdict checks matter most. A verdict that hides a missing source, or a
 * verdict that passes a denied claim, breaks the report for the human gate.
 */

import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { newestDate, parseDate, readDates } from "../src/dates.js";
import { extractMainText } from "../src/fetch.js";
import { needsNoSource, readSections, sectionAt } from "../src/sections.js";
import { loadPolicy } from "../src/policy.js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadFactBank, matchProof, readProofFile } from "../src/brain.js";
import { markdownReport, reviewVerdict, ReviewVerdict } from "../src/report.js";
import {
  DEFAULT_SETTINGS,
  emptyState,
  pagePath,
  readPage,
  writePage,
  type RunState,
} from "../src/run.js";
import { AnchorMethod, ClaimKind, SourceType, Verdict, type Candidate } from "../src/models.js";

// ---- dates -------------------------------------------------------------------

describe("the dates of a page", () => {
  it("prefers the date that the page states over the header", () => {
    const html = `<html><head>
      <script type="application/ld+json">{"datePublished":"2022-08-26T10:00:00Z"}</script>
    </head><body><p>text</p></body></html>`;
    const dates = readDates(html, "Mon, 31 Aug 2026 22:00:00 GMT");
    expect(dates.publishedAt?.toISOString().slice(0, 10)).toBe("2022-08-26");
  });

  it("reads the article meta tag when there is no JSON-LD", () => {
    const html = `<meta property="article:published_time" content="2021-03-04" />`;
    expect(readDates(html).publishedAt?.toISOString().slice(0, 10)).toBe("2021-03-04");
  });

  it("uses the header only as the last answer", () => {
    const dates = readDates("<p>no dates here</p>", "Mon, 31 Aug 2026 22:00:00 GMT");
    expect(dates.publishedAt).toBeNull();
    expect(dates.modifiedAt?.toISOString().slice(0, 10)).toBe("2026-08-31");
  });

  it("refuses a bare number, which is not a date", () => {
    // `new Date("2024")` returns a date. That would turn a version number into
    // a publication date and break the age check.
    expect(parseDate("2024")).toBeNull();
    expect(parseDate("")).toBeNull();
    expect(parseDate("not a date")).toBeNull();
  });

  it("returns the later of the two dates", () => {
    const older = new Date("2020-01-01");
    const newer = new Date("2024-01-01");
    expect(newestDate(older, newer)).toBe(newer);
    expect(newestDate(null, newer)).toBe(newer);
    expect(newestDate(null, null)).toBeNull();
  });
});

// ---- the brain fact bank -----------------------------------------------------

function writeBank(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "brain-"));
  const dir = join(root, "Marketing", "examples");
  mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(dir, name), body, "utf-8");
  }
  return root;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const policyPack = loadPolicy(join(HERE, "..", "..", "policies"), ["core", "software", "web-stack"]);

const PROOF = `---
type: asset
owner: Chris
share: company
status: active
---
# GP Notebook — case study (citable proof points)

- **One-liner:** Replatformed a 100,000+ subpage medical platform to Next.js and Sanity.

## Results (citable numbers only)
- **Organic traffic doubled within 2 years of the relaunch** (client analytics).
- INTERNAL: the contract value was well above the usual range for this size.
- [VERIFY] The client reports a 30% fall in editorial effort since the relaunch.
`;

describe("the brain fact bank", () => {
  it("reads a file that obeys the membership rule", () => {
    const root = writeBank({ "gpn.md": PROOF });
    const bank = loadFactBank(root);
    expect(bank).toHaveLength(1);
    expect(bank[0]!.lines.length).toBeGreaterThan(2);
  });

  it("refuses a file whose heading does not carry the suffix", () => {
    const body = PROOF.replace("# GP Notebook — case study (citable proof points)", "# GP Notebook notes");
    const root = writeBank({ "gpn.md": body });
    expect(loadFactBank(root)).toEqual([]);
  });

  it("refuses a file that is not active", () => {
    const root = writeBank({ "gpn.md": PROOF.replace("status: active", "status: stub") });
    expect(loadFactBank(root)).toEqual([]);
  });

  it("returns an empty bank for an absent brain, and never throws", () => {
    expect(loadFactBank(join(tmpdir(), "no-brain-here"))).toEqual([]);
  });

  it("matches a claim to the proof line that states it", () => {
    const bank = loadFactBank(writeBank({ "gpn.md": PROOF }));
    const match = matchProof("Organic traffic doubled within 2 years of the relaunch.", bank);
    expect(match).not.toBeNull();
    expect(match!.proofLine.text).toContain("Organic traffic doubled");
    expect(match!.citable).toBe(true);
  });

  it("refuses a claim whose number the proof line does not state", () => {
    const bank = loadFactBank(writeBank({ "gpn.md": PROOF }));
    // The bank says the traffic doubled. It never says it tripled in 5 years.
    expect(matchProof("Organic traffic doubled within 5 years of the relaunch.", bank)).toBeNull();
  });

  it("marks an INTERNAL line as not citable", () => {
    const bank = loadFactBank(writeBank({ "gpn.md": PROOF }));
    const match = matchProof(
      "The contract value was well above the usual range for this size.",
      bank,
    );
    expect(match).not.toBeNull();
    expect(match!.citable).toBe(false);
    expect(match!.blockReason).toContain("INTERNAL");
  });

  it("marks a [VERIFY] line as not citable", () => {
    const bank = loadFactBank(writeBank({ "gpn.md": PROOF }));
    const match = matchProof(
      "The client reports a 30% fall in editorial effort since the relaunch.",
      bank,
    );
    expect(match).not.toBeNull();
    expect(match!.citable).toBe(false);
    expect(match!.blockReason).toContain("VERIFY");
  });

  it("reads the owner and the tier of a proof file", () => {
    const root = writeBank({ "gpn.md": PROOF });
    const file = readProofFile(join(root, "Marketing", "examples", "gpn.md"), "gpn.md");
    expect(file?.owner).toBe("Chris");
    expect(file?.share).toBe("company");
  });
});

// ---- the report and the verdict ----------------------------------------------

function candidate(claimId: string, overrides: Partial<Candidate> = {}): Candidate {
  return {
    claimId,
    url: "https://docs.example/page",
    canonicalUrl: "https://docs.example/page",
    domain: "docs.example",
    sourceType: SourceType.OFFICIAL_DOCS,
    tierWeight: 1,
    origin: "search",
    searchRank: null,
    fetchStatus: null,
    pageTitle: "",
    publishedAt: null,
    modifiedAt: null,
    isLivingDocument: true,
    temporalRelation: null,
    quote: "The supported versions are Node.js 20, 22, and 24.",
    verdict: Verdict.SUPPORTS,
    confidence: 0.9,
    reasoning: "",
    valueMatch: true,
    quoteCarriesClaim: true,
    sameContext: true,
    coversFullClaim: true,
    quoteSelfContained: true,
    currencyStatus: "current",
    score: 90,
    accepted: true,
    rejectReason: null,
    rejectDetail: "",
    ...overrides,
  };
}

function stateWith(candidates: Candidate[], claimCount: number): RunState {
  const state = emptyState("https://pagepro.co/blog/post/", {
    ...DEFAULT_SETTINGS,
    targetSourceCount: 1,
  });
  state.claims = Array.from({ length: claimCount }, (_unused, index) => ({
    id: `c0${index + 1}`,
    text: `Claim ${index + 1}`,
    kind: ClaimKind.OTHER,
    subject: "Node.js",
    anchorMethod: AnchorMethod.EXACT,
    span: null,
    anchorScore: 100,
  }));
  for (const claim of state.claims) {
    state.plans[claim.id] = {
      claimId: claim.id,
      requiredTerms: [],
      requiredValues: [],
      preferredDomains: [],
      directUrls: [],
      queries: [],
    };
  }
  state.candidates = candidates;
  return state;
}

describe("the review verdict", () => {
  it("passes when every claim reached a source", () => {
    const state = stateWith([candidate("c01")], 1);
    expect(reviewVerdict(state).verdict).toBe(ReviewVerdict.PASS);
  });

  it("blocks when an official page denies a claim", () => {
    const denied = candidate("c01", {
      verdict: Verdict.CONTRADICTS,
      accepted: false,
      rejectReason: "entailment_contradicts",
      rejectDetail: "The page states another version.",
    });
    const report = reviewVerdict(stateWith([denied], 1));
    expect(report.verdict).toBe(ReviewVerdict.BLOCKED);
    expect(report.reasons[0]).toContain("denies");
  });

  it("blocks when a claim rests on a proof line that is not citable", () => {
    const state = stateWith([candidate("c01")], 1);
    state.internalProofs = [
      {
        claimId: "c01",
        file: "Marketing/examples/gpn.md",
        line: 12,
        section: "Results",
        text: "INTERNAL: the contract value.",
        citable: false,
        blockReason: "The line is marked INTERNAL. It never reaches an article.",
      },
    ];
    expect(reviewVerdict(state).verdict).toBe(ReviewVerdict.BLOCKED);
  });

  it("warns, and never blocks, when a claim reached no source", () => {
    const state = stateWith([], 1);
    const report = reviewVerdict(state);
    expect(report.verdict).toBe(ReviewVerdict.PASS_WITH_WARNINGS);
    expect(report.reasons.join(" ")).toContain("no source");
  });

  it("states a degraded search in the verdict", () => {
    const state = stateWith([candidate("c01")], 1);
    state.budget = {
      maxSearchCallsPerRun: 30,
      searchCallsUsed: 3,
      resultsSeen: 0,
      exhausted: false,
      provider: "web-search",
      degraded: true,
      degradedReason: "The search tool returned nothing.",
    };
    const report = reviewVerdict(state);
    expect(report.verdict).toBe(ReviewVerdict.PASS_WITH_WARNINGS);
    expect(report.reasons.join(" ")).toContain("degraded");
  });
});

describe("the report", () => {
  it("names every claim without a source", () => {
    const state = stateWith([], 2);
    const text = markdownReport(state);
    expect(text).toContain("## Claims without a source");
    expect(text).toContain("Claim 1");
    expect(text).toContain("Claim 2");
  });

  it("puts the denied claim in its own section, with the source", () => {
    const denied = candidate("c01", {
      verdict: Verdict.CONTRADICTS,
      accepted: false,
      rejectReason: "entailment_contradicts",
      reasoning: "The page states Node.js 20, 22, and 24.",
    });
    const text = markdownReport(stateWith([denied], 1));
    expect(text).toContain("## Claims that an official page denies");
    expect(text).toContain("https://docs.example/page");
    expect(text).toContain("Node.js 20, 22, and 24");
  });

  it("states the source count and the missing count together", () => {
    const text = markdownReport(stateWith([candidate("c01")], 2));
    expect(text).toContain("- Claims with a source: 1");
    expect(text).toContain("- Claims without a source: 1");
  });

  it("names the link that the sentence already carries", () => {
    // A live run proposed a source for a sentence that already linked to it.
    const state = stateWith([candidate("c01")], 1);
    state.claimLinks = {
      c01: [{ href: "https://docs.example/page", text: "official docs", start: 0 }],
    };
    const text = markdownReport(state);
    expect(text).toContain("- Claims that already carry a link: 1");
    expect(text).toContain("Already in the article: <https://docs.example/page>");
    expect(text).toContain("already_linked");
  });

  it("states the existing link of a claim that reached no source", () => {
    const state = stateWith([], 1);
    state.claimLinks = {
      c01: [{ href: "https://other.example/guide", text: "a guide", start: 0 }],
    };
    const text = markdownReport(state);
    expect(text).toContain("The sentence already links to <https://other.example/guide>");
  });

  it("says that nothing was checked when the article gave no claim", () => {
    // A list of questions reached the report with "Every claim received a
    // source", which reads as a result when nothing was checked.
    const text = markdownReport(stateWith([], 0));
    expect(text).not.toContain("Every claim received a source.");
    expect(text).not.toContain("No claim reached the quality threshold.");
    expect(text).toContain("The run checked no claim");
  });

  it("names the proof file of a claim that the brain proves", () => {
    const state = stateWith([], 1);
    state.internalProofs = [
      {
        claimId: "c01",
        file: "Marketing/examples/gpn.md",
        line: 12,
        section: "Results",
        text: "Organic traffic doubled within 2 years.",
        citable: true,
        blockReason: "",
      },
    ];
    const text = markdownReport(state);
    expect(text).toContain("## Claims that the brain proves");
    expect(text).toContain("Marketing/examples/gpn.md");
  });
});

describe("a claim that the brain proves", () => {
  function stateWithProof(): RunState {
    const state = stateWith([], 2);
    state.internalProofs = [
      {
        claimId: "c01",
        file: "Marketing/examples/gpn.md",
        line: 29,
        section: "Results",
        text: "Organic traffic doubled within 2 years of the relaunch.",
        citable: true,
        blockReason: "",
      },
    ];
    return state;
  }

  it("never counts as a claim without a source", () => {
    // The proof exists. It is internal. Counting it as missing reads as a gap
    // in the article, which is wrong.
    const report = reviewVerdict(stateWithProof());
    expect(report.reasons.join(" ")).toContain("1 claim(s) reached no source");
  });

  it("never appears in the list of claims without a source", () => {
    const text = markdownReport(stateWithProof());
    const section = text.slice(text.indexOf("## Claims without a source"));
    expect(section).not.toContain("c01.");
    expect(section).toContain("c02.");
  });

  it("states its own count in the run facts", () => {
    expect(markdownReport(stateWithProof())).toContain(
      "- Claims that need no external source: 1",
    );
  });
});

describe("the file that holds one page", () => {
  it("gives a different name to every address", () => {
    // Four pages of one documentation section used to share one file, because
    // the name was the first 80 characters of the base64 address. Each write
    // overwrote the last, so the quote gate read the wrong page.
    const urls = [
      "https://developers.google.com/search/docs/appearance/structured-data",
      "https://developers.google.com/search/docs/appearance/structured-data/sd-policies",
      "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
      "https://developers.google.com/search/docs/appearance/structured-data/search-gallery",
    ];
    const names = new Set(urls.map((url) => pagePath("/run", url)));
    expect(names.size).toBe(urls.length);
  });

  it("returns the text that was written for that address", () => {
    const dir = mkdtempSync(join(tmpdir(), "run-"));
    const a = "https://developers.google.com/search/docs/appearance/structured-data";
    const b = "https://developers.google.com/search/docs/appearance/structured-data/sd-policies";
    writePage(dir, a, "the testing tool page");
    writePage(dir, b, "the general guidelines page");
    expect(readPage(dir, a)).toBe("the testing tool page");
    expect(readPage(dir, b)).toBe("the general guidelines page");
  });
});

describe("the section of a claim", () => {
  const html = `<html><head><title>Guide</title></head><body><main>
    <h2>What structured data does in CMS migration</h2>
    <p>Structured data preserves the meaning of your content for search engines.</p>
    <h2>FAQ</h2>
    <p>Legacy schema is mapped by linking old database columns to matching fields.</p>
  </main></body></html>`;

  it("names the heading that stands above a claim", () => {
    const { text } = extractMainText(html);
    const sections = readSections(html, text);
    expect(sections.map((s) => s.heading)).toEqual([
      "What structured data does in CMS migration",
      "FAQ",
    ]);

    const body = text.indexOf("Structured data preserves");
    const faq = text.indexOf("Legacy schema is mapped");
    expect(sectionAt(sections, body)).toBe("What structured data does in CMS migration");
    expect(sectionAt(sections, faq)).toBe("FAQ");
  });

  it("marks an FAQ heading as needing no source", () => {
    const markers = ["faq", "frequently asked questions"];
    expect(needsNoSource("FAQ", markers)).toBe(true);
    expect(needsNoSource("Frequently Asked Questions", markers)).toBe(true);
    expect(needsNoSource("What structured data does in CMS migration", markers)).toBe(false);
    expect(needsNoSource("", markers)).toBe(false);
  });

  it("reads the list from the policy pack, not from the code", () => {
    // A different house style names the block differently. The list is data.
    expect(policyPack.noSourceSections).toContain("faq");
    expect(policyPack.noSourceSections.length).toBeGreaterThan(2);
  });

  it("keeps an FAQ claim out of the count of claims without a source", () => {
    const state = stateWith([], 2);
    state.noSourceClaimIds = ["c01"];
    state.claimSections = { c01: "FAQ", c02: "How to migrate" };
    const report = reviewVerdict(state);
    expect(report.reasons.join(" ")).toContain("1 claim(s) reached no source");

    const text = markdownReport(state);
    expect(text).toContain("## Claims in a section that carries no citation");
    const gap = text.slice(text.indexOf("## Claims without a source"));
    expect(gap).not.toContain("c01.");
    expect(gap).toContain("c02.");
  });

  it("states how many body claims reached a source", () => {
    const state = stateWith([], 2);
    state.noSourceClaimIds = ["c01"];
    state.claimSections = { c01: "FAQ", c02: "How to migrate" };
    expect(markdownReport(state)).toContain("- Claims in the body: 1, of which 0 reached a source");
  });
});

describe("a claim that was never searched", () => {
  it("is named in the report as unsearched, not as sourceless", () => {
    // A run reported three claims with no source for an article it had never
    // searched, and the report read like a run that searched and found
    // nothing. The two must never look alike.
    const state = stateWith([], 2);
    state.unsearchedClaimIds = ["c01"];
    const text = markdownReport(state);
    expect(text).toContain("**This claim was never searched.**");
    expect(text).toContain("an absence of work, not a finding");
  });

  it("states it in the verdict reasons", () => {
    const state = stateWith([], 2);
    state.unsearchedClaimIds = ["c01"];
    const report = reviewVerdict(state);
    expect(report.reasons.join(" ")).toContain("never searched");
  });

  it("says nothing when every claim was searched", () => {
    const state = stateWith([], 2);
    state.unsearchedClaimIds = [];
    expect(markdownReport(state)).not.toContain("never searched");
    expect(reviewVerdict(state).reasons.join(" ")).not.toContain("never searched");
  });
});
