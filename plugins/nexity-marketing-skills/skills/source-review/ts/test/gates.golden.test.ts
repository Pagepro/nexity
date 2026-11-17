/**
 * Golden checks for the evidence plan and the gates.
 *
 * The checks run on the text that the Python extractor produced, stored in
 * `fixtures/corpus/text/`. That separates two questions:
 *
 * 1. Do the gates return the same answer on the same text? This file.
 * 2. Does the TypeScript extractor produce equivalent text? A later step.
 *
 * Mixing the two would hide a gate fault behind an extractor difference.
 */

import { gunzipSync } from "node:zlib";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { loadPolicy } from "../src/policy.js";
import { ClaimKind } from "../src/models.js";
import { buildPlan, requiredTermsOf, requiredValuesOf } from "../src/evidencePlan.js";
import { productVersions, versionScopeOk } from "../src/contradiction.js";
import { MAX_PAGE_CHARS_FOR_JUDGE, relevantExcerpt } from "../src/verify.js";
import { missingTerms, missingValues, quoteIsInPage } from "../src/textops.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const GOLDEN_DIR = join(REPO_ROOT, "fixtures", "golden");
const TEXT_DIR = join(REPO_ROOT, "fixtures", "corpus", "text");

function golden<T>(name: string): T {
  return JSON.parse(readFileSync(join(GOLDEN_DIR, name), "utf-8")) as T;
}

interface PlanRow {
  id: string;
  text: string;
  required_values: string[];
  required_terms: string[];
}
interface FuzzyGolden {
  plans: PlanRow[];
  version_scope: { claim: string; page: string; in_scope: boolean }[];
}
interface GateRow {
  id: string;
  url: string;
  positive_quote: string;
  claims: Record<string, { missing_values: string[]; missing_terms: string[] }>;
  value_probe?: { present_missing: string[]; absent_missing: string[] };
}

const fuzzy = golden<FuzzyGolden>("fuzzy.json");
const gates = golden<GateRow[]>("gates.json");
const provenance = golden<{ fabricated_quote: string }>("provenance.json");
const policy = loadPolicy(join(REPO_ROOT, "policies"), golden<{ packs: string[] }>("policy.json").packs);

function pageText(id: string): string | null {
  const path = join(TEXT_DIR, `${id}.json.gz`);
  if (!existsSync(path)) return null;
  const payload = JSON.parse(gunzipSync(readFileSync(path)).toString("utf-8")) as {
    text: string;
  };
  return payload.text;
}

describe("evidence plan", () => {
  it.each(fuzzy.plans.map((row) => [row.id, row] as const))(
    "reads the same required values for %s",
    (_id, row) => {
      expect(requiredValuesOf(row.text)).toEqual(row.required_values);
    },
  );

  it("keeps a lower-case identifier as a term", () => {
    const terms = requiredTermsOf({
      text: "It utilizes the rn-diff-purge project internally to identify file changes.",
      subject: "React Native CLI",
    });
    expect(terms).toContain("rn-diff-purge");
    expect(terms).toContain("React Native CLI");
  });

  it("never keeps a pronoun as a term", () => {
    const terms = requiredTermsOf({
      text: "Our client postponed the update of their React Native version.",
      subject: "React Native",
    });
    expect(terms).not.toContain("Our");
  });

  it("puts the claim sentence in the first query", () => {
    const plan = buildPlan(
      {
        id: "c1",
        text: "Google structured data documentation recommends JSON-LD as the easiest format.",
        kind: ClaimKind.OTHER,
        subject: "Google",
      },
      policy,
      3,
    );
    expect(plan.queries[0]!.text).toContain("structured data documentation");
    // The list is the authority for the subject, not a fixed pair. The
    // structured data subject names schema.org next to the Google docs.
    expect(plan.queries[0]!.domains).toContain("developers.google.com");
    expect(plan.queries.every((query) => !query.text.includes("site:"))).toBe(true);
  });

  it("names the distinctive term somewhere in the queries", () => {
    const plan = buildPlan(
      {
        id: "c1",
        text: "Google crawler treats llms.txt as an ordinary text file.",
        kind: ClaimKind.OTHER,
        subject: "Google",
      },
      policy,
      3,
    );
    expect(plan.queries.map((query) => query.text).join(" ")).toContain("llms.txt");
  });
});

describe("version scope", () => {
  it.each(fuzzy.version_scope.map((row, index) => [index, row] as const))(
    "probe %i keeps the Python decision",
    (_index, row) => {
      expect(versionScopeOk(row.claim, row.page)).toBe(row.in_scope);
    },
  );

  it("pairs a name with its number and skips a month", () => {
    const found = productVersions("Next.js 14 added Turbopack in October 2024.");
    expect(found.get("next.js")).toEqual(["14"]);
    expect(found.has("october")).toBe(false);
  });
});

// The page corpus is not shipped with the skill; this suite skips without it.
describe.skipIf(!existsSync(TEXT_DIR))("gates on the corpus", () => {
  const rows = gates.filter((row) => pageText(row.id) !== null);

  it("covers most of the corpus", () => {
    expect(rows.length).toBeGreaterThan(60);
  });

  it("returns the Python answer for every value gate and term gate", () => {
    const plans = new Map(
      fuzzy.plans.map((plan) => [
        plan.id,
        { requiredValues: plan.required_values, requiredTerms: plan.required_terms },
      ]),
    );
    const wrong: string[] = [];

    for (const row of rows) {
      const text = pageText(row.id)!;
      for (const [probeId, expected] of Object.entries(row.claims)) {
        const plan = plans.get(probeId)!;
        const values = missingValues(plan.requiredValues, text);
        const terms = missingTerms(plan.requiredTerms, text);
        if (
          JSON.stringify(values) !== JSON.stringify(expected.missing_values) ||
          JSON.stringify(terms) !== JSON.stringify(expected.missing_terms)
        ) {
          wrong.push(`${row.url} / ${probeId}`);
        }
      }
    }
    expect(wrong, `${wrong.length} gate answers differ:\n${wrong.slice(0, 8).join("\n")}`).toEqual(
      [],
    );
  });

  it("accepts a real sentence and refuses an invented one on every page", () => {
    const refusedReal: string[] = [];
    const acceptedFake: string[] = [];

    for (const row of rows) {
      const text = pageText(row.id)!;
      if (!quoteIsInPage(row.positive_quote, text)) refusedReal.push(row.url);
      if (quoteIsInPage(provenance.fabricated_quote, text)) acceptedFake.push(row.url);
    }
    expect(refusedReal, `real sentences refused:\n${refusedReal.slice(0, 5).join("\n")}`).toEqual(
      [],
    );
    expect(
      acceptedFake,
      `invented sentences accepted:\n${acceptedFake.slice(0, 5).join("\n")}`,
    ).toEqual([]);
  });

  it("keeps the curated value probes", () => {
    let checked = 0;
    for (const row of rows) {
      if (!row.value_probe) continue;
      const text = pageText(row.id)!;
      expect(missingValues(row.value_probe.present_missing, text)).toEqual([]);
      checked += 1;
    }
    expect(checked).toBeGreaterThanOrEqual(2);
  });

  it("returns an excerpt no longer than the limit", () => {
    const plan = { requiredValues: ["16"], requiredTerms: ["PostgreSQL"] };
    for (const row of rows.slice(0, 20)) {
      const excerpt = relevantExcerpt(pageText(row.id)!, plan, MAX_PAGE_CHARS_FOR_JUDGE);
      expect(excerpt.length).toBeLessThanOrEqual(MAX_PAGE_CHARS_FOR_JUDGE);
    }
  });
});

describe("a capital letter that only opens a sentence", () => {
  it("never becomes a required term", () => {
    // "Bypass" and "Legacy" reached the search query and the term gate as if
    // they named a product. Both came from the first word of the claim.
    for (const text of [
      "Bypass staging authentication barriers by pasting the raw HTML into the tool.",
      "Legacy schema is mapped by linking old database columns to matching fields.",
    ]) {
      const terms = requiredTermsOf({ text, subject: "structured data" });
      expect(terms.map((term) => term.toLowerCase())).not.toContain(text.split(" ")[0]!.toLowerCase());
    }
  });

  it("keeps a real name that the sentence states twice", () => {
    const terms = requiredTermsOf({
      text: "Google Search reads the structured data that Google finds on the web.",
      subject: "",
    });
    expect(terms.join(" ")).toContain("Google");
  });

  it("keeps a name that stands anywhere but first", () => {
    const terms = requiredTermsOf({
      text: "The tool reads JSON-LD markup on every Shopify store.",
      subject: "",
    });
    expect(terms.join(" ")).toContain("Shopify");
  });
});
