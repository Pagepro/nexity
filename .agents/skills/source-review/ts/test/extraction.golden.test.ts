/**
 * Extraction measurement, locked as a floor.
 *
 * `trafilatura` and this extractor never produce the same text, so this file
 * does not compare text. It locks two things:
 *
 * 1. A safety property that must hold exactly: an invented sentence must fail
 *    the quote gate on every page. A failure here is a defect.
 * 2. A floor for the agreement with Python. The numbers come from the
 *    measurement in `scripts/compare-extraction.ts`. The port may improve them.
 *    It must never fall below them.
 *
 * Read `docs/PORT-CONTRACT.md` section 5.2 for the measured figures and for the
 * known gap.
 */

import { gunzipSync } from "node:zlib";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  challengeName,
  classifyThinPage,
  extractMainText,
  looksLikeChallenge,
  statusOf,
} from "../src/fetch.js";
import { FetchStatus } from "../src/models.js";
import { missingTerms, missingValues, quoteIsInPage } from "../src/textops.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const CORPUS_DIR = join(REPO_ROOT, "fixtures", "corpus");
const GOLDEN_DIR = join(REPO_ROOT, "fixtures", "golden");
const MIN_PAGE_CHARS = 400;
// The 4 MB page corpus is not shipped with the skill; its suites skip without it.
const HAS_CORPUS = existsSync(join(CORPUS_DIR, "manifest.json"));

// The floors come from the measurement recorded in the port contract.
const FLOOR_STATUS = 80;
const FLOOR_TITLE = 84;
const FLOOR_GATES = 484;

function golden<T>(name: string): T {
  return JSON.parse(readFileSync(join(GOLDEN_DIR, name), "utf-8")) as T;
}

interface ManifestPage {
  id: string;
  url: string;
  file: string;
  status: string;
}
interface ExtractionRow {
  id: string;
  fetch_status: string;
  title: string;
}
interface GateRow {
  id: string;
  url: string;
  positive_quote: string;
  claims: Record<string, { missing_values: string[]; missing_terms: string[] }>;
}

const manifest = (
  HAS_CORPUS ? JSON.parse(readFileSync(join(CORPUS_DIR, "manifest.json"), "utf-8")) : { pages: [] }
) as { pages: ManifestPage[] };
const extraction = new Map(
  golden<ExtractionRow[]>("extraction.json").map((row) => [row.id, row]),
);
const gates = new Map(golden<GateRow[]>("gates.json").map((row) => [row.id, row]));
const plans = new Map(
  golden<{ plans: { id: string; required_values: string[]; required_terms: string[] }[] }>(
    "fuzzy.json",
  ).plans.map((plan) => [
    plan.id,
    { requiredValues: plan.required_values, requiredTerms: plan.required_terms },
  ]),
);
const fabricated = golden<{ fabricated_quote: string }>("provenance.json").fabricated_quote;

interface Measured {
  pages: number;
  statusSame: number;
  titleSame: number;
  gateChecks: number;
  gateSame: number;
  quotePages: number;
  fabricatedAccepted: string[];
}

const measured: Measured = {
  pages: 0,
  statusSame: 0,
  titleSame: 0,
  gateChecks: 0,
  gateSame: 0,
  quotePages: 0,
  fabricatedAccepted: [],
};

for (const page of manifest.pages) {
  if (page.status !== "stored" && page.status !== "cached") continue;
  const path = join(CORPUS_DIR, page.file);
  const expected = extraction.get(page.id);
  if (!existsSync(path) || !expected) continue;

  const html = gunzipSync(readFileSync(path)).toString("utf-8");
  const { title, text } = extractMainText(html);
  measured.pages += 1;

  if (statusOf(html, text, MIN_PAGE_CHARS).status === expected.fetch_status) {
    measured.statusSame += 1;
  }
  if (title === expected.title) measured.titleSame += 1;

  const gateRow = gates.get(page.id);
  if (!gateRow) continue;

  for (const [probeId, want] of Object.entries(gateRow.claims)) {
    const plan = plans.get(probeId);
    if (!plan) continue;
    measured.gateChecks += 1;
    const values = missingValues(plan.requiredValues, text);
    const terms = missingTerms(plan.requiredTerms, text);
    if (
      JSON.stringify(values) === JSON.stringify(want.missing_values) &&
      JSON.stringify(terms) === JSON.stringify(want.missing_terms)
    ) {
      measured.gateSame += 1;
    }
  }

  if (gateRow.positive_quote) {
    measured.quotePages += 1;
    if (quoteIsInPage(fabricated, text)) measured.fabricatedAccepted.push(page.url);
  }
}

describe.skipIf(!HAS_CORPUS)("extraction safety", () => {
  it("measures the whole corpus", () => {
    expect(measured.pages).toBeGreaterThanOrEqual(80);
    expect(measured.quotePages).toBeGreaterThanOrEqual(70);
  });

  it("never accepts an invented sentence on any page", () => {
    // This is the anti-hallucination control. A failure is a defect, not a
    // difference between two extractors.
    expect(
      measured.fabricatedAccepted,
      `an invented sentence passed on:\n${measured.fabricatedAccepted.slice(0, 5).join("\n")}`,
    ).toEqual([]);
  });
});

describe.skipIf(!HAS_CORPUS)("agreement with the Python extractor", () => {
  it(`keeps the fetch status of at least ${FLOOR_STATUS} pages`, () => {
    expect(measured.statusSame).toBeGreaterThanOrEqual(FLOOR_STATUS);
  });

  it(`keeps the title of at least ${FLOOR_TITLE} pages`, () => {
    expect(measured.titleSame).toBeGreaterThanOrEqual(FLOOR_TITLE);
  });

  it(`keeps at least ${FLOOR_GATES} gate answers`, () => {
    expect(measured.gateChecks).toBeGreaterThanOrEqual(500);
    expect(measured.gateSame).toBeGreaterThanOrEqual(FLOOR_GATES);
  });
});

describe("the link rule", () => {
  const prose =
    "PostgreSQL 16 added parallel execution for a FULL outer join and for a " +
    "RIGHT outer join. The planner now splits the work across workers, so a " +
    "report over a large table returns sooner than it did in release 15.";

  it("drops a navigation list that only holds version numbers", () => {
    const page = `<html><head><title>Releases</title></head><body><main>
      <p>${prose}</p>
      <ul>
        <li><a href="/16">Release notes for 16</a></li>
        <li><a href="/15">Release notes for 15</a></li>
        <li><a href="/14">Release notes for 14</a></li>
        <li><a href="/13">Release notes for 13</a></li>
      </ul>
    </main></body></html>`;
    const { text } = extractMainText(page);
    expect(text).toContain("parallel execution");
    expect(text).not.toContain("Release notes for 14");
  });

  it("keeps a post list that shows an excerpt under each link", () => {
    const excerpt =
      "The release changes the planner. Read the note for the full list of the " +
      "operators that now run in parallel, and for the settings that control them.";
    const page = `<html><head><title>Blog</title></head><body><main>
      <ul>
        <li><a href="/a">Release 16</a><p>${excerpt}</p></li>
        <li><a href="/b">Release 15</a><p>${excerpt}</p></li>
      </ul>
    </main></body></html>`;
    const { text } = extractMainText(page);
    expect(text).toContain("The release changes the planner");
    expect(text).toContain("Release 16");
  });

  it("reads the main container and leaves the side column out", () => {
    const page = `<html><head><title>Docs</title></head><body>
      <div id="sidebar"><p>Every other page of this site is listed here.</p></div>
      <main><p>${prose}</p></main>
    </body></html>`;
    const { text } = extractMainText(page);
    expect(text).toContain("parallel execution");
    expect(text).not.toContain("Every other page");
  });
});

describe("a table inside a figure", () => {
  it("keeps the rows of a WordPress table block", () => {
    // WordPress wraps a table in `<figure class="wp-block-table">`. Stripping
    // `figure` removed a comparison table that carried real facts, and a live
    // run lost a claim because of it.
    const page = `<html><head><title>Guide</title></head><body><main>
      <p>Most content-heavy sites keep their rankings when they replatform.</p>
      <figure class="wp-block-table"><table><thead><tr><th>Myth</th><th>Reality</th></tr></thead>
      <tbody><tr><td>Headless cannot rank</td>
      <td>Modern headless builds ship editable SEO fields in the content model.</td></tr></tbody>
      </table></figure>
    </main></body></html>`;
    const { text } = extractMainText(page);
    expect(text).toContain("Modern headless builds ship editable SEO fields");
  });
});

describe("a page that is a browser check", () => {
  // A host behind such a check answers a plain client with a challenge page.
  // The status alone reads as "the server is busy", which sent a person off to
  // wait for something that never changes. A live run reported HTTP 429 four
  // times against contentful.com for exactly that reason.
  const vercel =
    "<html><head><title>Vercel Security Checkpoint</title></head><body>" +
    "<p>We're verifying your browser. Website owner? Click here to fix</p></body></html>";
  const drupal =
    "<html><head><title>Client Challenge</title></head><body>" +
    "<p>A required part of this site couldn't load. This may be due to a browser extension.</p>" +
    "</body></html>";
  const realJs =
    "<html><head><title>Our App</title></head><body>" +
    "<p>You need to enable JavaScript to run this app.</p></body></html>";

  it("names the check instead of blaming the status", () => {
    expect(looksLikeChallenge(vercel)).toBe(true);
    const outcome = classifyThinPage(vercel, "short", 400);
    expect(outcome.status).toBe(FetchStatus.BLOCKED);
    expect(outcome.detail).toContain("Vercel Security Checkpoint");
    expect(outcome.detail).toContain("no retry will");
  });

  it("reads the title when the body carries no known phrase", () => {
    expect(challengeName(drupal)).toBe("Client Challenge");
    expect(looksLikeChallenge(drupal)).toBe(true);
    expect(classifyThinPage(drupal, "short", 400).status).toBe(FetchStatus.BLOCKED);
  });

  it("still reports a real JavaScript page as one", () => {
    // The check must not swallow the ordinary cause. This page is an app that
    // needs a browser, not a host that refuses one.
    expect(looksLikeChallenge(realJs)).toBe(false);
    expect(classifyThinPage(realJs, "short", 400).status).toBe(FetchStatus.JS_REQUIRED);
  });

  it("never calls an ordinary page a check", () => {
    const page = "<html><head><title>Pricing</title></head><body><p>Our plans start at $15.</p></body></html>";
    expect(looksLikeChallenge(page)).toBe(false);
  });
});
