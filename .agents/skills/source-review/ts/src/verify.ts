/**
 * Evidence verification.
 *
 * This module is a port of `src/claim_source_reviewer/pipeline/verify.py`.
 *
 * The gates run in two groups, and the split matters for the skill:
 *
 * - `preJudgeGates` runs before the model sees the page. A page that fails here
 *   costs no model turn.
 * - `applyVerdict` runs after the model answers. It validates the answer against
 *   the page text.
 *
 * **The agent proposes, this code decides.** The model supplies a verdict, a
 * confidence, and a quote. This code checks that the quote is in the page and
 * that the confidence reaches the threshold of the source type. A fabricated
 * quote fails mechanically, whatever the model claims.
 */

import type { Policy } from "./policy.js";
import {
  ClaimKind,
  CurrencyStatus,
  RejectReason,
  SourceType,
  Verdict,
  type EvidencePlan,
} from "./models.js";
import { fold, missingTerms, missingValues, normalizeWs, quoteIsInPage, splitSentences } from "./textops.js";

/** A source type that carries the authority of the product owner. */
export const AUTHORITATIVE_TYPES: ReadonlySet<SourceType> = new Set([
  SourceType.OFFICIAL_DOCS,
  SourceType.OFFICIAL_RELEASE,
  SourceType.OFFICIAL_ADVISORY,
  SourceType.OFFICIAL_BLOG,
  SourceType.STANDARDS_BODY,
]);

export const DETERMINISTIC_CONFIDENCE = 0.75;
export const DETERMINISTIC_TYPES: ReadonlySet<SourceType> = new Set([
  SourceType.OFFICIAL_DOCS,
  SourceType.OFFICIAL_RELEASE,
  SourceType.OFFICIAL_ADVISORY,
  SourceType.STANDARDS_BODY,
]);
export const MAX_PAGE_CHARS_FOR_JUDGE = 6000;

export interface Rejection {
  reason: RejectReason;
  detail: string;
}

export interface CandidateInput {
  url: string;
  domain: string;
  sourceType: SourceType;
}

export interface Limits {
  requireOfficialSourceForKnownSubject: boolean;
  maxQuoteChars: number;
}

export const DEFAULT_LIMITS: Limits = {
  requireOfficialSourceForKnownSubject: true,
  maxQuoteChars: 400,
};

/** The count of passages that a long page contributes to the excerpt. */
export const EXCERPT_PASSAGES = 3;

/** The marker between two passages. A quote may never cross it. */
export const PASSAGE_SEPARATOR = ["", "", "[...]", "", ""].join(String.fromCharCode(10));

/** Words that carry no topic and must not score a window. */
const WINDOW_STOP_WORDS = new Set([
  "the", "and", "for", "that", "this", "with", "from", "your", "you", "are",
  "was", "were", "has", "have", "not", "but", "its", "their", "can", "will",
  "may", "when", "what", "how", "why", "into", "than", "then", "also", "each",
]);

/** Return the topic words of a claim. */
function claimWords(claimText: string): string[] {
  const words = fold(claimText).match(/[a-z0-9][a-z0-9.+-]*/g) ?? [];
  return [...new Set(words.filter((word) => word.length > 3 && !WINDOW_STOP_WORDS.has(word)))];
}

/**
 * Return how much one occurrence of a needle is worth, from 0 to 1.
 *
 * A needle that the page states once is worth a full point. A needle in every
 * passage is worth a fraction of one, because it cannot tell two passages
 * apart.
 */
function rarity(needle: string, foldedPage: string): number {
  if (!needle) return 0;
  let hits = 0;
  let at = foldedPage.indexOf(needle);
  while (at >= 0 && hits < 512) {
    hits += 1;
    at = foldedPage.indexOf(needle, at + needle.length);
  }
  if (hits === 0) return 0;
  return 1 / (1 + Math.log2(hits));
}

/**
 * Return the parts of a page that a judge must read.
 *
 * Two faults sat in the first version, and a live run showed both.
 *
 * The first: it returned one window. A page of twenty thousand characters gave
 * one window of six thousand, and the rest of the page was invisible. The
 * sentence that settled a claim sat outside the window twice in a row.
 *
 * The second points the wrong way by design. The score gave three points to a
 * required value. A passage that **denies** a claim never states the value of
 * the claim; it states a different one. So the passage that carries the most
 * valuable answer of the whole run scored lowest and was least likely to be
 * shown. On the domain migration article the claim said 180 days and the page
 * said one year, and the page said it outside the window.
 *
 * The fix reads the page in several passages and scores a window by the topic
 * words of the claim as well, so a passage about the same subject rises even
 * when it holds no number of the claim.
 *
 * The passages are joined by `PASSAGE_SEPARATOR`, which marks the cut for the
 * reader.
 *
 * The separator is not a guard. `quoteIsInPage` falls back to a check of each
 * sentence, so a quote built from one real sentence of each passage still
 * passes. That fallback exists on purpose: it rescued a true source once. What
 * stops a stitched quote is the rule in the skill file and the
 * `quoteSelfContained` answer of the judge, not this string.
 */
export function relevantExcerpt(
  pageText: string,
  plan: Pick<EvidencePlan, "requiredValues" | "requiredTerms">,
  maxChars: number,
  claimText = "",
): string {
  if (pageText.length <= maxChars) return pageText;

  const values = plan.requiredValues.filter(Boolean).map(fold);
  const terms = plan.requiredTerms.filter(Boolean).map(fold);
  const topic = claimWords(claimText);
  if (values.length === 0 && terms.length === 0 && topic.length === 0) {
    return pageText.slice(0, maxChars);
  }

  // The separators count against the budget, so the whole excerpt never grows
  // past `maxChars`. The judge reads a fixed amount either way.
  const separatorCost = (EXCERPT_PASSAGES - 1) * PASSAGE_SEPARATOR.length;
  const windowChars = Math.max(400, Math.floor((maxChars - separatorCost) / EXCERPT_PASSAGES));
  const step = Math.max(1, Math.floor(windowChars / 2));

  // A word that the page repeats says little about which passage answers the
  // claim. Three live runs lost a true source this way: the Netlify page
  // repeats "redirect" in every passage, so the window that states the default
  // status code scored no higher than the rest and stayed out of the excerpt.
  // The same happened to the NDJSON rule of Sanity and to the ranking
  // sentence of the Google site move page. A rare word now counts for more.
  const whole = fold(pageText);
  const weightOf = new Map<string, number>();
  for (const needle of [...values, ...terms, ...topic]) {
    weightOf.set(needle, rarity(needle, whole));
  }

  const scored: { start: number; score: number }[] = [];
  for (let start = 0; start < pageText.length; start += step) {
    const window = fold(pageText.slice(start, start + windowChars));
    let score = 0;
    for (const value of values) if (window.includes(value)) score += 3 * (weightOf.get(value) ?? 1);
    for (const term of terms) if (window.includes(term)) score += 2 * (weightOf.get(term) ?? 1);
    // The topic words carry the weight that finds a denial. One point each, so
    // a passage on the subject rises without holding a number of the claim.
    for (const word of topic) if (window.includes(word)) score += 1 * (weightOf.get(word) ?? 1);
    scored.push({ start, score });
  }
  scored.sort((left, right) => right.score - left.score || left.start - right.start);

  const chosen: { start: number; score: number }[] = [];
  for (const candidate of scored) {
    if (chosen.length >= EXCERPT_PASSAGES) break;
    if (candidate.score <= 0) break;
    const overlaps = chosen.some((taken) => Math.abs(taken.start - candidate.start) < windowChars);
    if (!overlaps) chosen.push(candidate);
  }
  if (chosen.length === 0) return pageText.slice(0, maxChars);

  chosen.sort((left, right) => left.start - right.start);
  return chosen
    .map((part) => pageText.slice(part.start, part.start + windowChars))
    .join(PASSAGE_SEPARATOR);
}

/**
 * Run every gate that does not need the model.
 *
 * Return the rejection, or `null` when the candidate may reach the model.
 */
export function preJudgeGates(options: {
  candidate: CandidateInput;
  plan: EvidencePlan;
  pageText: string;
  policy: Policy;
  /** The subject of the claim. It decides which repository owner is trusted. */
  subject?: string | undefined;
  /** The kind of the claim. A statistic accepts an industry measurement. */
  claimKind?: ClaimKind | undefined;
  /** The title of the page. The term gate reads it with the text. */
  pageTitle?: string | undefined;
  limits?: Limits;
}): Rejection | null {
  const { candidate, plan, pageText, policy, subject, claimKind, pageTitle } = options;
  const limits = options.limits ?? DEFAULT_LIMITS;

  if (!policy.isAllowed(candidate.sourceType)) {
    return {
      reason: RejectReason.SOURCE_TYPE_BLOCKED,
      detail: `The source type ${candidate.sourceType} is not evidence.`,
    };
  }

  if (limits.requireOfficialSourceForKnownSubject && plan.preferredDomains.length > 0) {
    // The policy pack knows where the product owner publishes. A page from
    // anywhere else is not evidence about that product.
    const onOfficialHost = plan.preferredDomains.some((domain) => {
      const host = domain.split("/")[0]!;
      return candidate.domain === host || candidate.domain.endsWith(`.${host}`);
    });
    // The repository of the product owner is the product owner. `discover.ts`
    // already trusts it, and this gate used to refuse it, so the official CLI
    // repository of a vendor was blocked as having no authority about that
    // vendor. A live run lost the evidence for two claims that way.
    const onTrustedRepository = policy.isTrustedRepository(candidate.url, subject ?? null);

    // For a statistic, the measurement is the authority, not the vendor.
    // W3Techs measures the share of WordPress, and wordpress.org quotes it. A
    // live run refused W3Techs for "It powers more than 40% of all websites"
    // and left the claim with no source. The exception covers a statistic
    // only: for what a product does or costs, the vendor stays the authority.
    const industryStatistic =
      candidate.sourceType === SourceType.INDUSTRY_SOURCE && claimKind === ClaimKind.STATISTIC;

    if (
      !AUTHORITATIVE_TYPES.has(candidate.sourceType) &&
      !onOfficialHost &&
      !onTrustedRepository &&
      !industryStatistic
    ) {
      return {
        reason: RejectReason.NON_AUTHORITATIVE,
        detail:
          `The claim is about a product that publishes on ` +
          `${plan.preferredDomains.slice(0, 3).join(", ")}. The page ${candidate.domain} ` +
          `carries no authority about it.`,
      };
    }
  }

  const valueGaps = missingValues(plan.requiredValues, pageText);
  if (valueGaps.length > 0) {
    return {
      reason: RejectReason.VALUE_MISMATCH,
      detail: `The page does not state: ${valueGaps.join(", ")}.`,
    };
  }

  if (plan.requiredTerms.length > 0) {
    // The title is part of the page. The official Workspaces page of Chrome
    // DevTools says "DevTools" 17 times in its text and "Chrome DevTools" only
    // in its title, so the gate refused the product's own page. The value gate
    // and the quote gate still read the text alone.
    const termText = pageTitle ? `${pageTitle}\n${pageText}` : pageText;
    const termGaps = missingTerms(plan.requiredTerms, termText);
    if (termGaps.length === plan.requiredTerms.length) {
      return {
        reason: RejectReason.REQUIRED_TERM_MISSING,
        detail: `The page names none of: ${plan.requiredTerms.join(", ")}.`,
      };
    }
  }
  return null;
}

export interface ModelVerdict {
  verdict: Verdict;
  confidence: number;
  quote: string;
  reasoning: string;
  /**
   * Four answers that only a reader of the page can give.
   *
   * A lexical rule cannot tell whether a page is about the same situation as
   * the claim, whether it proves the whole claim, whether a quote stands on
   * its own, or whether it states the current state of a product. The judge
   * answers each one, and this module enforces the answer. That keeps the
   * decision in code while the judgement stays with the reader.
   *
   * They are optional so an older answer still parses. A missing answer is
   * read as the safe value, never as a pass.
   */
  sameContext?: boolean | undefined;
  coversFullClaim?: boolean | undefined;
  quoteSelfContained?: boolean | undefined;
  currencyStatus?: CurrencyStatus | undefined;
}

export interface VerdictOutcome {
  accepted: boolean;
  sameContext: boolean;
  coversFullClaim: boolean;
  quoteSelfContained: boolean;
  currencyStatus: CurrencyStatus;
  /** False when the quote names nothing the claim asks for. A warning only. */
  quoteCarriesClaim: boolean;
  quote: string;
  confidence: number;
  reasoning: string;
  rejection: Rejection | null;
}

/**
 * Validate the answer of the model against the page.
 *
 * This function never trusts the model. It checks the verdict, then the quote
 * against the page text, then the confidence against the threshold of the
 * source type.
 */
export function applyVerdict(options: {
  candidate: CandidateInput;
  pageText: string;
  answer: ModelVerdict;
  policy: Policy;
  /** The plan of the claim. The quote must carry something the claim asks for. */
  plan?: Pick<EvidencePlan, "requiredValues" | "requiredTerms"> | undefined;
  limits?: Limits;
}): VerdictOutcome {
  const { candidate, pageText, answer, policy, plan } = options;
  const limits = options.limits ?? DEFAULT_LIMITS;

  const quote = normalizeWs(answer.quote).slice(0, limits.maxQuoteChars);
  const reasoning = normalizeWs(answer.reasoning);
  // A missing answer is read as the safe value. An old judge file must never
  // pass a gate by leaving a field out.
  const sameContext = answer.sameContext ?? false;
  const coversFullClaim = answer.coversFullClaim ?? false;
  const quoteSelfContained = answer.quoteSelfContained ?? false;
  const currencyStatus = answer.currencyStatus ?? CurrencyStatus.UNCLEAR;
  const base = {
    quote,
    confidence: answer.confidence,
    reasoning,
    quoteCarriesClaim: true,
    sameContext,
    coversFullClaim,
    quoteSelfContained,
    currencyStatus,
  };

  if (answer.verdict === Verdict.CONTRADICTS) {
    // A contradiction is the highest stake answer of the whole run. It tells a
    // person to change a published article, so its quote must be real.
    //
    // The check used to run only for `supports`, because this branch returned
    // first. A contradiction could therefore rest on an invented sentence and
    // nothing would catch it.
    if (quote && !quoteIsInPage(quote, pageText)) {
      return {
        ...base,
        accepted: false,
        rejection: {
          reason: RejectReason.QUOTE_NOT_IN_PAGE,
          detail:
            "The page was reported as denying the claim, but the quote is not in the page. " +
            "The run does not report a contradiction on an unverified quote.",
        },
      };
    }
    return {
      ...base,
      accepted: false,
      rejection: {
        reason: RejectReason.ENTAILMENT_CONTRADICTS,
        detail: reasoning || "The page states a different value.",
      },
    };
  }
  if (answer.verdict !== Verdict.SUPPORTS) {
    return {
      ...base,
      accepted: false,
      rejection: {
        reason: RejectReason.ENTAILMENT_INSUFFICIENT,
        detail: reasoning || "The page does not state the claim.",
      },
    };
  }
  if (!quoteIsInPage(quote, pageText)) {
    return {
      ...base,
      accepted: false,
      rejection: {
        reason: RejectReason.QUOTE_NOT_IN_PAGE,
        detail: "The quote is not in the page text.",
      },
    };
  }

  // Does the quote carry the claim, or is it only a true sentence of the page?
  //
  // This started as a rejection and became a warning, because a measurement
  // showed the rule cannot answer that question. On the claim about pasting
  // HTML into the Rich Results Test, the quote that documents the mechanism
  // shares one word with the claim, while a quote that does not document it
  // shares four. The lexical signal points the wrong way, so a block on it
  // loses good sources. Only the judge can tell the two apart.
  //
  // The flag still reaches the report, so a person sees which source rests on
  // a quote that names nothing the claim asks for.
  let quoteCarriesClaim = true;
  if (plan) {
    const wanted = [...plan.requiredValues, ...plan.requiredTerms];
    if (wanted.length > 0) {
      const low = fold(quote);
      quoteCarriesClaim = wanted.some((token) => low.includes(fold(token)));
    }
  }

  // The four answers of the judge. Each one is a gate, and the code applies
  // it. The order runs from the widest question to the narrowest.
  if (!sameContext) {
    return {
      ...base,
      accepted: false,
      rejection: {
        reason: RejectReason.OFF_CONTEXT,
        detail:
          reasoning ||
          "The page is about a different product, version, or situation than the claim.",
      },
    };
  }
  if (!coversFullClaim) {
    return {
      ...base,
      accepted: false,
      rejection: {
        reason: RejectReason.PARTIAL_CLAIM,
        detail: reasoning || "The page proves only one part of the claim.",
      },
    };
  }
  if (!quoteSelfContained) {
    return {
      ...base,
      accepted: false,
      rejection: {
        reason: RejectReason.QUOTE_NOT_SELF_CONTAINED,
        detail:
          reasoning || "The quote depends on text outside the quoted passage.",
      },
    };
  }
  if (currencyStatus === CurrencyStatus.UNCLEAR || currencyStatus === CurrencyStatus.OUTDATED) {
    return {
      ...base,
      accepted: false,
      rejection: {
        reason: RejectReason.SOURCE_NOT_CURRENT,
        detail: reasoning || `The state of the page is ${currencyStatus}.`,
      },
    };
  }

  const threshold = policy.minConfidence(candidate.sourceType);
  if (answer.confidence < threshold) {
    return {
      ...base,
      accepted: false,
      rejection: {
        reason: RejectReason.BELOW_TIER_THRESHOLD,
        detail:
          `The confidence ${answer.confidence.toFixed(2)} is below the threshold ` +
          `${threshold.toFixed(2)} for ${candidate.sourceType}.`,
      },
    };
  }
  return { ...base, accepted: true, quoteCarriesClaim, rejection: null };
}

/** Return a page sentence that states every required value. */
export function deterministicQuote(pageText: string, plan: EvidencePlan): string {
  for (const sentence of splitSentences(pageText)) {
    if (sentence.length < 20 || sentence.length > 400) continue;
    if (missingValues(plan.requiredValues, sentence).length > 0) continue;
    if (
      plan.requiredTerms.length > 0 &&
      missingTerms(plan.requiredTerms, sentence).length === plan.requiredTerms.length
    ) {
      continue;
    }
    return normalizeWs(sentence);
  }
  return "";
}
