/**
 * Domain model.
 *
 * This module is a port of `src/claim_source_reviewer/models.py`. It holds the
 * value types that every stage reads and writes. It holds no network code.
 *
 * Python uses `Enum`. TypeScript uses a frozen object with a union type, so the
 * values serialise to the same strings in JSON.
 */

export const SourceType = {
  OFFICIAL_DOCS: "official_docs",
  OFFICIAL_RELEASE: "official_release",
  OFFICIAL_ADVISORY: "official_advisory",
  STANDARDS_BODY: "standards_body",
  OFFICIAL_BLOG: "official_blog",
  INDUSTRY_SOURCE: "industry_source",
  CODE_REPOSITORY: "code_repository",
  GENERAL_WEB: "general_web",
  USER_GENERATED: "user_generated",
} as const;
export type SourceType = (typeof SourceType)[keyof typeof SourceType];

export const ClaimKind = {
  VERSION: "version",
  STATISTIC: "statistic",
  DATE: "date",
  FEATURE_NAME: "feature_name",
  PRICE: "price",
  STANDARD: "standard",
  OTHER: "other",
} as const;
export type ClaimKind = (typeof ClaimKind)[keyof typeof ClaimKind];

export const FetchStatus = {
  OK: "ok",
  HTTP_ERROR: "http_error",
  TIMEOUT: "timeout",
  BLOCKED: "blocked",
  PAYWALL: "paywall",
  JS_REQUIRED: "js_required",
  TOO_SHORT: "too_short",
  UNSUPPORTED_TYPE: "unsupported_type",
} as const;
export type FetchStatus = (typeof FetchStatus)[keyof typeof FetchStatus];

export const Verdict = {
  SUPPORTS: "supports",
  INSUFFICIENT: "insufficient",
  CONTRADICTS: "contradicts",
} as const;
export type Verdict = (typeof Verdict)[keyof typeof Verdict];

export const RejectReason = {
  FETCH_FAILED: "fetch_failed",
  SOURCE_TYPE_BLOCKED: "source_type_blocked",
  SELF_CITATION: "self_citation",
  NON_AUTHORITATIVE: "non_authoritative",
  REQUIRED_TERM_MISSING: "required_term_missing",
  VALUE_MISMATCH: "value_mismatch",
  QUOTE_NOT_IN_PAGE: "quote_not_in_page",
  QUOTE_OFF_CLAIM: "quote_off_claim",
  OFF_CONTEXT: "off_context",
  PARTIAL_CLAIM: "partial_claim",
  QUOTE_NOT_SELF_CONTAINED: "quote_not_self_contained",
  SOURCE_NOT_CURRENT: "source_not_current",
  ENTAILMENT_INSUFFICIENT: "entailment_insufficient",
  ENTAILMENT_CONTRADICTS: "entailment_contradicts",
  BELOW_TIER_THRESHOLD: "below_tier_threshold",
  OVER_TOTAL_CAP: "over_total_cap",
  DUPLICATE_URL: "duplicate_url",
  BUDGET_EXHAUSTED: "budget_exhausted",
  JUDGE_ERROR: "judge_error",
} as const;
export type RejectReason = (typeof RejectReason)[keyof typeof RejectReason];

/**
 * How the state of a page relates to the claim in time.
 *
 * The judge answers this. A vendor rewrites its documentation, so a page that
 * once stated the claim may now state something else.
 */
export const CurrencyStatus = {
  CURRENT: "current",
  HISTORICAL_MATCH: "historical_match",
  NOT_APPLICABLE: "not_applicable",
  UNCLEAR: "unclear",
  OUTDATED: "outdated",
} as const;
export type CurrencyStatus = (typeof CurrencyStatus)[keyof typeof CurrencyStatus];

export const TemporalRelation = {
  LIVING: "living",
  SOURCE_NEWER: "source_newer",
  SOURCE_OLDER: "source_older",
  UNDATED: "undated",
} as const;
export type TemporalRelation = (typeof TemporalRelation)[keyof typeof TemporalRelation];

export const ContradictionState = {
  CONFIRMED: "confirmed",
  NEEDS_REVIEW: "needs_review",
} as const;
export type ContradictionState =
  (typeof ContradictionState)[keyof typeof ContradictionState];

/** One search query and the domains that it may return. */
export interface SearchQuery {
  text: string;
  domains: string[];
}

/** Rules that a page must meet to prove one claim. */
export interface EvidencePlan {
  claimId: string;
  requiredTerms: string[];
  requiredValues: string[];
  preferredDomains: string[];
  directUrls: string[];
  queries: SearchQuery[];
}

/** One page that may prove one claim. */
export interface Candidate {
  claimId: string;
  url: string;
  canonicalUrl: string;
  domain: string;
  sourceType: SourceType;
  tierWeight: number;
  /** `direct_url`, `manual`, or `search`. */
  origin: "direct_url" | "manual" | "search";
  searchRank: number | null;

  fetchStatus: FetchStatus | null;
  pageTitle: string;
  publishedAt: Date | null;
  modifiedAt: Date | null;
  isLivingDocument: boolean;
  temporalRelation: TemporalRelation | null;

  quote: string;
  verdict: Verdict | null;
  confidence: number;
  reasoning: string;
  valueMatch: boolean;
  /** False when the quote names nothing the claim asks for. A warning only. */
  quoteCarriesClaim: boolean;
  /** The judge answers: is the page about the same situation as the claim? */
  sameContext: boolean;
  /** The judge answers: does the page prove the whole claim, not one part? */
  coversFullClaim: boolean;
  /** The judge answers: does the quote stand without the text around it? */
  quoteSelfContained: boolean;
  /** The judge answers: does the page state the current state of the product? */
  currencyStatus: CurrencyStatus;

  score: number;
  accepted: boolean;
  rejectReason: RejectReason | null;
  rejectDetail: string;
}

/** Method that located the claim text in the article text. */
export const AnchorMethod = {
  EXACT: "exact",
  NORMALIZED: "normalized",
  FUZZY: "fuzzy",
  NOT_FOUND: "not_found",
} as const;
export type AnchorMethod = (typeof AnchorMethod)[keyof typeof AnchorMethod];

/** One statement from the article that needs a source. */
export interface Claim {
  id: string;
  text: string;
  kind: ClaimKind;
  subject: string;
  anchorMethod: AnchorMethod;
  span: { start: number; end: number } | null;
  anchorScore: number;
}

/**
 * Record of how the pipeline produced the claim list.
 *
 * The report always reaches the output. A dropped sentence is never silent.
 */
export interface ExtractionReport {
  rawClaimCount: number;
  anchoredClaimCount: number;
  /** Claims that are not in the article text. These are invented claims. */
  droppedUnanchored: string[];
  /** Claims about the author's own project. No external page can prove them. */
  droppedUnverifiable: string[];
  /** Sentences that are prose, not facts. */
  droppedProse: string[];
  /** Sentences with no checkable value. Strict mode only. */
  droppedNoValue: string[];
  truncatedToLimit: boolean;
}

/** Final state of one claim after the run. */
export interface ClaimResult {
  claim: Claim;
  plan: EvidencePlan;
  accepted: Candidate | null;
  rejected: Candidate[];
}
