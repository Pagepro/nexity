/**
 * Golden checks for the policy packs.
 *
 * `fixtures/golden/policy.json` holds the answer of the Python implementation
 * for every address in the corpus, plus the addresses that earlier faults
 * exposed. The classification is pure logic, so the port must match it exactly.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { loadPolicy } from "../src/policy.js";
import { SourceType } from "../src/models.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const GOLDEN_DIR = join(REPO_ROOT, "fixtures", "golden");
const POLICY_DIR = join(REPO_ROOT, "policies");

interface PolicyRow {
  url: string;
  canonical_url: string;
  source_type: string;
  weight: number;
  min_confidence: number;
  allowed: boolean;
  living_document: boolean;
  trusted_repository: boolean;
}
interface PolicyGolden {
  packs: string[];
  rows: PolicyRow[];
}

const golden = JSON.parse(
  readFileSync(join(GOLDEN_DIR, "policy.json"), "utf-8"),
) as PolicyGolden;

const policy = loadPolicy(POLICY_DIR, golden.packs);

describe("policy pack loading", () => {
  it("loads the same packs in the same order", () => {
    expect(policy.packs).toEqual(golden.packs);
  });

  it("reads a rule of every kind", () => {
    expect(policy.domains.length).toBeGreaterThan(100);
    expect(policy.subjects.size).toBeGreaterThan(25);
    expect(policy.claimSignals.length).toBeGreaterThan(8);
    expect(policy.trustedRepoOwners.length).toBeGreaterThan(30);
    expect(policy.proseMarkers.length).toBeGreaterThan(10);
    expect(policy.unverifiableMarkers.length).toBeGreaterThan(10);
    expect(policy.livingPathMarkers.length).toBeGreaterThan(5);
  });
});

describe("source classification", () => {
  it("gives every address the Python source type", () => {
    const wrong: string[] = [];
    for (const row of golden.rows) {
      const actual = policy.classify(row.url);
      if (actual !== row.source_type) {
        wrong.push(`${row.url}\n  python: ${row.source_type}\n  node:   ${actual}`);
      }
    }
    expect(
      wrong,
      `${wrong.length} of ${golden.rows.length} addresses differ:\n${wrong.slice(0, 8).join("\n")}`,
    ).toEqual([]);
  });

  it("gives every address the Python weight and threshold", () => {
    const wrong: string[] = [];
    for (const row of golden.rows) {
      const sourceType = policy.classify(row.url);
      if (
        policy.weight(sourceType) !== row.weight ||
        policy.minConfidence(sourceType) !== row.min_confidence ||
        policy.isAllowed(sourceType) !== row.allowed
      ) {
        wrong.push(row.url);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("marks the same pages as a living document", () => {
    const wrong: string[] = [];
    for (const row of golden.rows) {
      const sourceType = policy.classify(row.url);
      if (policy.isLivingDocument(row.url, sourceType) !== row.living_document) {
        wrong.push(`${row.url} expected ${row.living_document}`);
      }
    }
    expect(wrong, wrong.slice(0, 5).join("\n")).toEqual([]);
  });

  it("trusts the same repository owners", () => {
    const wrong: string[] = [];
    for (const row of golden.rows) {
      if (policy.isTrustedRepository(row.url) !== row.trusted_repository) {
        wrong.push(`${row.url} expected ${row.trusted_repository}`);
      }
    }
    expect(wrong, wrong.slice(0, 5).join("\n")).toEqual([]);
  });
});

describe("the rules that earlier faults exposed", () => {
  it("blocks a search result page but not vendor documentation", () => {
    expect(policy.classify("https://www.google.com/search?q=node")).toBe(
      SourceType.USER_GENERATED,
    );
    expect(policy.classify("https://developers.google.com/search/docs/essentials")).toBe(
      SourceType.OFFICIAL_DOCS,
    );
    expect(policy.classify("https://cloud.google.com/docs")).toBe(SourceType.OFFICIAL_DOCS);
  });

  it("treats a community tutorial site as not evidence", () => {
    const type = policy.classify("https://www.freecodecamp.org/news/semantic-ui-guide");
    expect(type).toBe(SourceType.USER_GENERATED);
    expect(policy.isAllowed(type)).toBe(false);
  });

  it("trusts a vendor repository through its subject", () => {
    const url = "https://github.com/cypress-io/cypress/issues/28269";
    expect(policy.isTrustedRepository(url, "cypress")).toBe(true);
    expect(policy.isTrustedRepository(url, "react")).toBe(false);
    expect(policy.isTrustedRepository("https://github.com/random-person/fork", "cypress")).toBe(
      false,
    );
  });

  it("promotes a release path on an official host", () => {
    expect(policy.classify("https://nodejs.org/en/blog/release/v22.0.0")).toBe(
      SourceType.OFFICIAL_RELEASE,
    );
  });
});

describe("subject and marker rules", () => {
  it.each([
    ["Node.js 22 is now the active version.", "node.js"],
    ["Bootstrap is a CSS framework.", "bootstrap"],
    ["Semantic UI is a responsive front-end framework.", "semantic ui"],
    ["MUI Core is a React component library.", "mui"],
    ["Chakra UI is a modular component library.", "chakra ui"],
    ["Site speed is a ranking factor.", "google search"],
    ["A 301 redirect preserves link equity.", "http redirect"],
  ])("matches the subject of %s", (text, expected) => {
    expect(policy.matchSubject(text)).toBe(expected);
  });

  it("names the marker of a sentence about the author's own work", () => {
    expect(policy.isUnverifiable("Our client waited two years.")).toBe("our client");
    expect(policy.isUnverifiable("This article has been prepared for Cypress 9.x.")).not.toBe("");
    expect(policy.isUnverifiable("Cypress 12 requires Node.js 14 or higher.")).toBe("");
  });

  it("names the marker of prose", () => {
    expect(policy.isProse("You can write your own test code.")).toBe("you can");
    expect(policy.isProse("As you can see there are functions named describe and it.")).not.toBe(
      "",
    );
    expect(policy.isProse("Vercel does not charge per user.")).toBe("");
  });

  it("finds a claim signal in a sentence with a value", () => {
    const names = new Set(policy.signalsIn("React 19 shipped on 2024-12-05.").map((s) => s.name));
    expect(names.has("iso_date")).toBe(true);
    expect(policy.signalsIn("This framework is a good choice for teams.")).toEqual([]);
  });
});
