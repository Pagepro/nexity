/**
 * Claim filters and anchoring.
 *
 * This module is a port of the deterministic half of
 * `src/claim_source_reviewer/pipeline/extract.py`.
 *
 * The language model selects the sentences. In the skill that model is the
 * agent, so this module takes the raw list and applies every rule that protects
 * the output:
 *
 * 1. A table row is not a sentence.
 * 2. A prose marker drops a second-person sentence, a description of the
 *    article's own code, or an evaluation.
 * 3. An unverifiable marker drops a sentence about the author's own work.
 * 4. Strict mode drops a sentence with no checkable value.
 * 5. Every surviving claim must be located in the article text. A claim with no
 *    location is invented, and the module drops it.
 *
 * Every dropped sentence reaches the report. A rule is never silent.
 */

import type { Policy } from "./policy.js";
import { AnchorMethod, ClaimKind, type Claim, type ExtractionReport } from "./models.js";
import { findAnchor, normalizeWs } from "./textops.js";
import { requiredValuesOf } from "./evidencePlan.js";

/** One row of the model answer, before any check. */
export interface RawClaim {
  text: string;
  kind?: string;
  subject?: string;
}

export interface AnchorOptions {
  maxClaims: number;
  /**
   * Strict mode. Keep a claim only when it states a version, a number, a
   * percentage, a date, or a standard identifier.
   *
   * The default is `false`, because the rule also drops a real fact that states
   * no number, such as "Vercel does not charge per user".
   */
  requireCheckableValue?: boolean;
}

export interface AnchorClaimsResult {
  claims: Claim[];
  report: ExtractionReport;
}

/** Report whether the text is a table row and not a sentence. */
export function isTableRow(text: string): boolean {
  return (text.match(/\|/g) ?? []).length >= 2;
}

/**
 * Return the kind of a claim.
 *
 * A kind that the agent states wins. Without one, the claim signals of the
 * policy decide. The agent writes `claims.json` with text and subject only, so
 * every claim of a live run came out as `other`, even "It powers more than 40%
 * of all websites". The authority gate reads the kind.
 *
 * The signals run without case, so the version signal reads "than 40" as a
 * product and a version. The first match therefore cannot decide. A price wins
 * over a count, so "$1 per 250k requests" stays a price, and a statistic wins
 * over everything else.
 */
export function kindOf(value: unknown, text: string, policy: Policy): ClaimKind {
  const known = Object.values(ClaimKind) as string[];
  if (known.includes(String(value))) return String(value) as ClaimKind;
  const found = policy.signalsIn(text).map((signal) => signal.kind);
  return KIND_PRECEDENCE.find((kind) => found.includes(kind)) ?? found[0] ?? ClaimKind.OTHER;
}

const KIND_PRECEDENCE: readonly ClaimKind[] = [ClaimKind.PRICE, ClaimKind.STATISTIC];

/**
 * Apply every deterministic rule to the raw claim list.
 *
 * The order matters. The unverifiable check runs before the value check,
 * because its reason tells the editor more: the sentence is your own claim, so
 * add the proof yourself.
 */
export function anchorClaims(
  raw: RawClaim[],
  articleText: string,
  policy: Policy,
  options: AnchorOptions,
): AnchorClaimsResult {
  const requireCheckableValue = options.requireCheckableValue ?? false;
  const report: ExtractionReport = {
    rawClaimCount: raw.length,
    anchoredClaimCount: 0,
    droppedUnanchored: [],
    droppedUnverifiable: [],
    droppedProse: [],
    droppedNoValue: [],
    truncatedToLimit: false,
  };

  const claims: Claim[] = [];
  const seen = new Set<string>();

  raw.forEach((row, index) => {
    const text = normalizeWs(String(row.text ?? ""));
    if (!text || seen.has(text.toLowerCase())) return;
    seen.add(text.toLowerCase());

    if (isTableRow(text)) {
      report.droppedProse.push(text);
      return;
    }

    const prose = policy.isProse(text);
    if (prose) {
      report.droppedProse.push(`${text} [marker: ${prose}]`);
      return;
    }

    const marker = policy.isUnverifiable(text);
    if (marker) {
      report.droppedUnverifiable.push(`${text} [marker: ${marker}]`);
      return;
    }

    if (requireCheckableValue && requiredValuesOf(text).length === 0) {
      report.droppedNoValue.push(text);
      return;
    }

    const anchor = findAnchor(articleText, text);
    if (anchor.method === AnchorMethod.NOT_FOUND) {
      report.droppedUnanchored.push(text);
      return;
    }

    claims.push({
      id: `c${String(index + 1).padStart(2, "0")}`,
      text,
      kind: kindOf(row.kind, text, policy),
      subject: normalizeWs(String(row.subject ?? "")) || (policy.matchSubject(text) ?? ""),
      anchorMethod: anchor.method,
      span: anchor.span,
      anchorScore: anchor.score,
    });
  });

  let kept = claims;
  if (kept.length > options.maxClaims) {
    kept = kept.slice(0, options.maxClaims);
    report.truncatedToLimit = true;
  }
  report.anchoredClaimCount = kept.length;
  return { claims: kept, report };
}
