/**
 * The run state of one article review.
 *
 * The skill runs as a sequence of commands. A command reads the state, does one
 * step, and writes the state back. The agent does the steps that need a model
 * between two commands.
 *
 * The state file is the contract between the two. It holds every decision, so
 * a person can read what happened without the conversation.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { Candidate, Claim, EvidencePlan, ExtractionReport } from "./models.js";
import type { SearchBudgetReport } from "./budget.js";
import type { ProofMatch } from "./brain.js";
import type { ArticleLink } from "./links.js";
import type { Section } from "./sections.js";

export const STATE_FILE = "state.json";
export const ARTICLE_FILE = "article.txt";
export const PAGES_DIR = "pages";

/** The settings of one run. Every one of them reaches the report. */
export interface RunSettings {
  /** The soft goal. The run reports a gap. It never removes a source. */
  targetSourceCount: number;
  /** The only cap. Zero means no cap. */
  maxSourcesTotal: number;
  maxClaims: number;
  maxQueriesPerClaim: number;
  maxCandidatesPerClaim: number;
  maxSearchCallsPerRun: number;
  /** Strict mode. A sentence with no number is dropped. */
  requireCheckableValue: boolean;
  policyPacks: string[];
  /** Path of the brain repository, or an empty string. */
  brainRoot: string;
}

export const DEFAULT_SETTINGS: RunSettings = {
  targetSourceCount: 3,
  maxSourcesTotal: 0,
  maxClaims: 15,
  maxQueriesPerClaim: 5,
  maxCandidatesPerClaim: 8,
  maxSearchCallsPerRun: 40,
  requireCheckableValue: false,
  policyPacks: ["core", "software", "web-stack"],
  brainRoot: "",
};

/** A fault that did not stop the run. */
export interface RunError {
  stage: string;
  target: string;
  message: string;
}

/** A claim that the brain proves. No web page can prove it. */
export interface InternalProof {
  claimId: string;
  file: string;
  line: number;
  section: string;
  text: string;
  citable: boolean;
  blockReason: string;
}

/** The state of one article review. */
export interface RunState {
  runId: string;
  /** The address or the path of the article. */
  sourceRef: string;
  articleUrl: string;
  title: string;
  /** The publication date of the article, as `YYYY-MM-DD`, or an empty string. */
  publishedAt: string;
  articleChars: number;
  settings: RunSettings;
  step: string;
  extraction: ExtractionReport | null;
  claims: Claim[];
  plans: Record<string, EvidencePlan>;
  candidates: Candidate[];
  internalProofs: InternalProof[];
  /** The headings of the article, with their place in the text. */
  sections: Section[];
  /** The section of each claim, by claim id. */
  claimSections: Record<string, string>;
  /** Every link that the article already carries, with its place in the text. */
  links: ArticleLink[];
  /** The links inside the sentence of each claim, by claim id. */
  claimLinks: Record<string, ArticleLink[]>;
  /** Claims that sit in a section the policy pack says needs no source. */
  noSourceClaimIds: string[];
  /**
   * Claims that reached the candidate step with no direct address and no
   * search result.
   *
   * A run that never searched a claim must not read like a run that searched
   * and found nothing. The report states the difference.
   */
  unsearchedClaimIds: string[];
  factBankFiles: number;
  budget: SearchBudgetReport | null;
  errors: RunError[];
  startedAt: string;
}

export function newRunId(): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return `run-${stamp}`;
}

export function emptyState(sourceRef: string, settings: RunSettings): RunState {
  return {
    runId: newRunId(),
    sourceRef,
    articleUrl: sourceRef.startsWith("http") ? sourceRef : "",
    title: "",
    publishedAt: "",
    articleChars: 0,
    settings,
    step: "start",
    extraction: null,
    claims: [],
    plans: {},
    candidates: [],
    internalProofs: [],
    sections: [],
    claimSections: {},
    links: [],
    claimLinks: {},
    noSourceClaimIds: [],
    unsearchedClaimIds: [],
    factBankFiles: 0,
    budget: null,
    errors: [],
    startedAt: new Date().toISOString(),
  };
}

export function statePath(dir: string): string {
  return join(dir, STATE_FILE);
}

export function loadState(dir: string): RunState {
  const path = statePath(dir);
  if (!existsSync(path)) {
    throw new Error(`No run in ${dir}. Run the start command first.`);
  }
  return JSON.parse(readFileSync(path, "utf-8")) as RunState;
}

export function saveState(dir: string, state: RunState): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(statePath(dir), `${JSON.stringify(state, null, 2)}\n`, "utf-8");
}

export function readArticle(dir: string): string {
  const path = join(dir, ARTICLE_FILE);
  if (!existsSync(path)) throw new Error(`No article text in ${dir}.`);
  return readFileSync(path, "utf-8");
}

export function writeArticle(dir: string, text: string): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, ARTICLE_FILE), text, "utf-8");
}

/**
 * Return the file that holds the text of one candidate page.
 *
 * The name is a hash of the whole address. An earlier version cut the base64
 * of the address to 80 characters, which encodes only the first 60 bytes. Four
 * pages of the same documentation section then shared one file, each write
 * overwrote the last, and the quote gate checked a quote against the wrong
 * page. That fault can reject a true quote, and it can accept a quote that
 * belongs to another page.
 */
export function pagePath(dir: string, url: string): string {
  const name = createHash("sha256").update(url).digest("hex").slice(0, 32);
  return join(dir, PAGES_DIR, `${name}.txt`);
}

export function writePage(dir: string, url: string, text: string): void {
  mkdirSync(join(dir, PAGES_DIR), { recursive: true });
  writeFileSync(pagePath(dir, url), text, "utf-8");
}

export function readPage(dir: string, url: string): string {
  const path = pagePath(dir, url);
  return existsSync(path) ? readFileSync(path, "utf-8") : "";
}

/** Record a fault without stopping the run. */
export function addError(state: RunState, stage: string, target: string, message: string): void {
  state.errors.push({ stage, target, message });
}

/** Convert a stored date to a `Date`, or `null`. */
export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Return the proof record of a claim, or `null`. */
export function proofRecord(claimId: string, match: ProofMatch): InternalProof {
  return {
    claimId,
    file: match.file.path,
    line: match.proofLine.line,
    section: match.proofLine.section,
    text: match.proofLine.text,
    citable: match.citable,
    blockReason: match.blockReason,
  };
}
