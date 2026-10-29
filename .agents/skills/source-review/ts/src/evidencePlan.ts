/**
 * Evidence plan.
 *
 * This module is a port of
 * `src/claim_source_reviewer/pipeline/evidence_plan.py`.
 *
 * For each claim the planner states three things:
 *
 * 1. The terms and the values that a page must contain.
 * 2. The domains and the known URLs that the pipeline must try first.
 * 3. The search queries to run when the direct URLs give no proof.
 *
 * The planner is deterministic. It reads the policy pack and calls no language
 * model, so the plan costs nothing and the tests can check it.
 */

import type { Policy } from "./policy.js";
import { ClaimKind, type EvidencePlan, type SearchQuery } from "./models.js";
import {
  ISO_DATE_PATTERN,
  PERCENT_PATTERN,
  STANDARD_PATTERN,
  VERSION_PATTERN,
  YEAR_PATTERN,
  fold,
  normalizeWs,
} from "./textops.js";

export const MAX_REQUIRED_VALUES = 3;
export const MAX_REQUIRED_TERMS = 4;
export const MAX_QUERY_CHARS = 220;

const PROPER_NOUN = /\b[A-Z][\w.+#-]{1,}\b(?:\s+[A-Z][\w.+#-]{1,}\b){0,2}/g;
const QUOTED = /["'“‘]([^"'”’]{2,40})["'”’]/g;

// A lower-case identifier such as `rn-diff-purge` or `package.json` names a
// tool or a file. It is often the most distinctive term of a claim. The
// proper-noun pattern misses it, because it starts with a lower-case letter.
const CODE_IDENTIFIER = /\b[a-z][a-z0-9]*(?:[-.][a-z0-9]+){1,}\b/g;

// A number that follows a name, such as `16` in `PostgreSQL 16`.
const NAMED_NUMBER = /\b[A-Z][A-Za-z0-9.+#-]*\s+v?(\d{1,4}(?:\.\d+)*)\b/g;

const STOP_WORDS = new Set([
  "the", "a", "an", "this", "that", "it", "its", "and", "or", "but", "in", "on",
  "of", "for", "with", "to", "from", "by", "as", "at", "is", "are", "was", "were",
  // A pronoun names nothing. A sentence that starts with `Our` used to put
  // `Our` in the required-term list.
  "we", "our", "ours", "us", "they", "them", "their", "theirs", "you", "your",
  "my", "mine", "these", "those", "there", "here",
  // Common sentence openers that the proper-noun pattern captures.
  "finally", "however", "also", "then", "when", "while", "e.g", "i.e",
]);

const KIND_HINTS: Record<ClaimKind, string> = {
  [ClaimKind.VERSION]: "release notes",
  [ClaimKind.DATE]: "release date",
  [ClaimKind.FEATURE_NAME]: "documentation",
  [ClaimKind.STATISTIC]: "report",
  [ClaimKind.PRICE]: "pricing",
  [ClaimKind.STANDARD]: "specification",
  [ClaimKind.OTHER]: "documentation",
};

export interface Claim {
  id: string;
  text: string;
  kind: ClaimKind;
  subject: string;
}

function findAll(pattern: RegExp, text: string, group = 0): string[] {
  const copy = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  return [...text.matchAll(copy)].map((match) => match[group] ?? "");
}

/**
 * Return the values that a proof page must state.
 *
 * The function prefers a specific value. It falls back to a number that follows
 * a name, such as `16` in `PostgreSQL 16`. It uses a bare year last.
 */
export function requiredValuesOf(text: string): string[] {
  const ordered: string[] = [];
  const push = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !ordered.includes(trimmed)) ordered.push(trimmed);
  };

  for (const pattern of [STANDARD_PATTERN, VERSION_PATTERN, PERCENT_PATTERN, ISO_DATE_PATTERN]) {
    for (const found of findAll(pattern, text)) push(found);
  }
  if (ordered.length === 0) {
    for (const found of findAll(NAMED_NUMBER, text, 1)) push(found);
  }
  if (ordered.length === 0) {
    for (const found of findAll(YEAR_PATTERN, text)) push(found);
  }
  return ordered.slice(0, MAX_REQUIRED_VALUES);
}

/**
 * Return the names that a proof page must state.
 *
 * The order is: the subject, then a quoted name, then a code identifier such as
 * `rn-diff-purge`, then a proper noun. A code identifier ranks above a proper
 * noun because it is more distinctive.
 */
/**
 * Report whether a word is capital only because it opens the sentence.
 *
 * The first word of a sentence carries a capital by grammar, not by being a
 * name. "Bypass staging authentication barriers" gave the term `Bypass`, and
 * "Legacy schema is mapped" gave `Legacy`. Both reached the search query and
 * the term gate as if they named a product.
 *
 * A real name usually appears again. The rule keeps a word that the sentence
 * states a second time, so "Google Search reads what Google publishes" keeps
 * `Google`.
 */
function isSentenceInitialOnly(word: string, text: string): boolean {
  if (!text.startsWith(word)) return false;
  return !text.slice(word.length).includes(word);
}

export function requiredTermsOf(claim: Pick<Claim, "text" | "subject">): string[] {
  const terms: string[] = [];
  const add = (candidate: string) => {
    const value = normalizeWs(candidate);
    if (value.length < 3) return;
    if (STOP_WORDS.has(value.toLowerCase())) return;
    if (terms.some((term) => term.toLowerCase() === value.toLowerCase())) return;
    terms.push(value);
  };

  if (claim.subject) add(claim.subject);
  for (const found of findAll(QUOTED, claim.text, 1)) add(found);
  for (const found of findAll(CODE_IDENTIFIER, claim.text)) add(found);
  for (const found of findAll(PROPER_NOUN, claim.text)) {
    if (isSentenceInitialOnly(found, claim.text)) continue;
    add(found);
  }
  return terms.slice(0, MAX_REQUIRED_TERMS);
}

function keywords(text: string, limit = 8): string[] {
  const words = text.match(/[\w.+#-]{3,}/g) ?? [];
  const out: string[] = [];
  for (const word of words) {
    const low = word.toLowerCase();
    if (STOP_WORDS.has(low)) continue;
    if (out.some((kept) => kept.toLowerCase() === low)) continue;
    out.push(word);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Return the search queries for one claim.
 *
 * The claim sentence is the first query. A search API reads a sentence, and the
 * sentence carries every distinctive word of the claim.
 *
 * An earlier version built the query from the subject and the numbers only. A
 * claim with no number then produced the query `Google documentation`, which
 * returned unrelated pages from the right host.
 *
 * The domain restriction travels in `SearchQuery.domains`, not in the query
 * text. A semantic search API reads `site:` as words, not as an operator.
 */
export function buildQueries(options: {
  claim: Claim;
  subject: string;
  values: string[];
  terms: string[];
  domains: string[];
  maxQueries: number;
}): SearchQuery[] {
  const { claim, subject, values, terms, domains, maxQueries } = options;
  const hint = KIND_HINTS[claim.kind] ?? "documentation";
  const sentence = normalizeWs(claim.text).slice(0, MAX_QUERY_CHARS);

  const foldedSubject = fold(subject);
  const distinctive = [subject, ...values.slice(0, 2)];
  distinctive.push(...terms.filter((term) => fold(term) !== foldedSubject).slice(0, 3));
  const named = normalizeWs(distinctive.filter(Boolean).join(" "));

  const withoutPath = domains.filter((domain) => !domain.includes("/"));
  const webDomains = (withoutPath.length > 0 ? withoutPath : domains).map(
    (domain) => domain.split("/")[0]!,
  );

  const queries: SearchQuery[] = [];
  if (webDomains.length > 0) {
    queries.push({ text: sentence, domains: webDomains.slice(0, 3) });
    if (named) {
      queries.push({ text: normalizeWs(`${named} ${hint}`), domains: webDomains.slice(0, 3) });
    }
  }
  queries.push({ text: named ? normalizeWs(`${named} ${hint}`) : sentence, domains: [] });

  // Two more angles on the same claim. A vendor states a fact in its help
  // centre or its release notes long before the reference documentation
  // repeats it, and a run that asked one question per claim reported a
  // missing source that these questions find.
  if (named && webDomains.length > 0) {
    queries.push({
      text: normalizeWs(`${named} help support how to`),
      domains: webDomains.slice(0, 3),
    });
    queries.push({
      text: normalizeWs(`${named} changelog release notes`),
      domains: webDomains.slice(0, 3),
    });
  }
  queries.push({ text: normalizeWs(keywords(claim.text).join(" ")), domains: [] });

  const unique: SearchQuery[] = [];
  const seen = new Set<string>();
  for (const query of queries) {
    const key = `${query.text}::${query.domains.join(",")}`;
    if (query.text && !seen.has(key)) {
      seen.add(key);
      unique.push(query);
    }
  }
  return unique.slice(0, maxQueries);
}

/** Return the evidence plan for one claim. */
export function buildPlan(claim: Claim, policy: Policy, maxQueries: number): EvidencePlan {
  const subjectKey = claim.subject || policy.matchSubject(claim.text) || "";
  const resolved = policy.matchSubject(subjectKey) ?? policy.matchSubject(claim.text);

  const values = requiredValuesOf(claim.text);
  const terms = requiredTermsOf(claim);
  const domains = policy.subjectDomains(resolved);
  const directUrls = policy.subjectDirectUrls(resolved);

  return {
    claimId: claim.id,
    requiredTerms: terms,
    requiredValues: values,
    preferredDomains: domains,
    directUrls,
    queries: buildQueries({
      claim,
      subject: subjectKey,
      values,
      terms,
      domains,
      maxQueries,
    }),
  };
}
