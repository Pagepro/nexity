/**
 * Ranking and final selection.
 *
 * This module is a port of `src/claim_source_reviewer/pipeline/rank.py`.
 *
 * Read the two limits with care. A wrong reading here loses verified sources
 * without saying so:
 *
 * - `targetSourceCount` is a soft goal. This module never removes a verified
 *   source to meet it. `meetsTarget` only reports the state.
 * - `maxSourcesTotal` is a hard cap. The value `0` means no cap. A value above
 *   `0` removes the lowest ranked verified sources and states the cause.
 */

import { RejectReason, TemporalRelation, type Candidate, type ClaimResult } from "./models.js";
import type { Policy } from "./policy.js";

// Authority leads. A run put a stat blog above vendor documentation because
// the judge gave the blog a high confidence, and confidence carried more
// weight than the tier. A confident reading of a weak page is still a weak
// page.
export const WEIGHT_TIER = 0.6;
export const WEIGHT_CONFIDENCE = 0.3;
export const WEIGHT_ORIGIN = 0.1;

/**
 * The penalty for a page that is older than the article.
 *
 * A living document carries no penalty. A vendor keeps its documentation
 * current, so its date states the last edit, not the age of the fact.
 *
 * An announcement from years back is a record of an event, not a statement of
 * the state today. It may still be the only page that states the fact, so the
 * penalty lowers its rank instead of rejecting it.
 */
export const PENALTY_SOURCE_OLDER = 0.15;

/** The penalty for a page that states no date at all. */
export const PENALTY_UNDATED = 0.03;

const ORIGIN_BONUS: Record<Candidate["origin"], number> = {
  direct_url: 0.7,
  manual: 0.6,
  search: 0.5,
};

export const NOT_SELECTED = "Not selected. Another candidate for this claim scored higher.";
export const OVER_CAP = "Removed by max_sources_total. Raise the cap to keep this source.";

/** Return the rank score of one verified candidate. */
export function scoreCandidate(candidate: Candidate): number {
  const origin = ORIGIN_BONUS[candidate.origin] ?? 0.5;
  let score =
    WEIGHT_TIER * candidate.tierWeight +
    WEIGHT_CONFIDENCE * candidate.confidence +
    WEIGHT_ORIGIN * origin;
  if (candidate.valueMatch) score += 0.02;

  // The age check reached the report but never the rank, so a page from years
  // back tied with the current documentation of the same vendor.
  if (candidate.temporalRelation === TemporalRelation.SOURCE_OLDER) {
    score -= PENALTY_SOURCE_OLDER;
  } else if (candidate.temporalRelation === TemporalRelation.UNDATED) {
    score -= PENALTY_UNDATED;
  }

  return Math.round(Math.max(Math.min(score, 1), 0) * 10_000) / 10_000;
}

/**
 * Choose one source for one claim.
 *
 * Every other candidate stays in the rejected list, so a person can read why
 * the pipeline did not use it.
 */
/**
 * Order two verified candidates.
 *
 * A fallback source never stands above a first-party one, whatever the
 * confidence. Only when the two sit in the same class does the score decide.
 */
export function compareAccepted(left: Candidate, right: Candidate, policy: Policy): number {
  const fallback =
    Number(policy.isFallbackOnly(left.sourceType)) - Number(policy.isFallbackOnly(right.sourceType));
  if (fallback !== 0) return fallback;
  const tier = right.tierWeight - left.tierWeight;
  if (tier !== 0) return tier;
  return right.score - left.score;
}

export function selectBest(result: ClaimResult, candidates: Candidate[], policy?: Policy): ClaimResult {
  const passed = candidates.filter((candidate) => candidate.accepted);
  if (policy) passed.sort((left, right) => compareAccepted(left, right, policy));
  const failed = candidates.filter((candidate) => !candidate.accepted);

  for (const candidate of passed) candidate.score = scoreCandidate(candidate);
  passed.sort((a, b) => b.score - a.score);

  if (passed.length > 0) {
    result.accepted = passed[0]!;
    for (const candidate of passed.slice(1)) {
      candidate.accepted = false;
      candidate.rejectDetail = NOT_SELECTED;
      failed.push(candidate);
    }
  }
  result.rejected = failed;
  return result;
}

/**
 * Apply the hard cap on the number of sources.
 *
 * Return the number of removed sources. The value `0` in `maxSourcesTotal`
 * means no cap, and the function removes nothing.
 */
export function applyTotalCap(results: ClaimResult[], maxSourcesTotal: number): number {
  if (maxSourcesTotal <= 0) return 0;

  const selected = results.filter((result) => result.accepted !== null);
  if (selected.length <= maxSourcesTotal) return 0;

  selected.sort((a, b) => (b.accepted?.score ?? 0) - (a.accepted?.score ?? 0));

  let removed = 0;
  for (const result of selected.slice(maxSourcesTotal)) {
    const candidate = result.accepted;
    if (!candidate) continue;
    candidate.accepted = false;
    candidate.rejectReason = RejectReason.OVER_TOTAL_CAP;
    candidate.rejectDetail = OVER_CAP;
    result.rejected.unshift(candidate);
    result.accepted = null;
    removed += 1;
  }
  return removed;
}

/**
 * Report whether the run reached the wanted number of sources.
 *
 * This check only reports. It never removes a verified source.
 */
export function meetsTarget(results: ClaimResult[], targetSourceCount: number): boolean {
  return results.filter((result) => result.accepted !== null).length >= targetSourceCount;
}
