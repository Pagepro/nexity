/**
 * Candidate discovery.
 *
 * This module is a port of `src/claim_source_reviewer/pipeline/discover.py`.
 *
 * The order of the sources is fixed:
 *
 * 1. Direct URLs from the policy pack. These are known official pages.
 * 2. Manual URLs from the user. Every URL in that field reaches the pipeline.
 * 3. Web search results.
 *
 * The search call itself lives outside this module. In the skill the agent runs
 * the search and hands the results here, so this code stays deterministic and
 * testable.
 */

import type { Policy } from "./policy.js";
import { hostOf } from "./policy.js";
import {
  CurrencyStatus, RejectReason, SourceType, type Candidate, type EvidencePlan } from "./models.js";
import { canonicalUrl } from "./textops.js";

export interface SearchHit {
  url: string;
  title?: string;
  rank?: number;
}

export interface DiscoverOptions {
  claimId: string;
  claimText: string;
  claimSubject: string;
  plan: EvidencePlan;
  policy: Policy;
  manualUrls?: string[];
  /** Address of the article under review. An article never proves itself. */
  articleUrl?: string;
  /** Results that the caller obtained from the search tool. */
  searchHits?: SearchHit[];
  maxCandidatesPerClaim: number;
}

function emptyCandidate(claimId: string, url: string, policy: Policy): Candidate {
  const sourceType = policy.classify(url);
  return {
    claimId,
    url,
    canonicalUrl: canonicalUrl(url),
    domain: hostOf(url),
    sourceType,
    tierWeight: policy.weight(sourceType),
    origin: "search",
    searchRank: null,
    fetchStatus: null,
    pageTitle: "",
    publishedAt: null,
    modifiedAt: null,
    isLivingDocument: policy.isLivingDocument(url, sourceType),
    temporalRelation: null,
    quote: "",
    verdict: null,
    confidence: 0,
    reasoning: "",
    valueMatch: false,
    quoteCarriesClaim: true,
    sameContext: false,
    coversFullClaim: false,
    quoteSelfContained: false,
    currencyStatus: CurrencyStatus.UNCLEAR,
    score: 0,
    accepted: false,
    rejectReason: null,
    rejectDetail: "",
  };
}

/** Build one candidate and apply the checks that need no download. */
export function makeCandidate(options: {
  claimId: string;
  url: string;
  policy: Policy;
  origin: Candidate["origin"];
  rank?: number | null;
  selfHost?: string;
  subject?: string | null;
}): Candidate {
  const { claimId, url, policy, origin, selfHost, subject } = options;
  const candidate = emptyCandidate(claimId, url, policy);
  candidate.origin = origin;
  candidate.searchRank = options.rank ?? null;

  if (selfHost && candidate.domain === selfHost) {
    // A search query repeats the words of the claim, so the reviewed article
    // ranks high in its own results. The article is not proof of itself.
    candidate.rejectReason = RejectReason.SELF_CITATION;
    candidate.rejectDetail = `The page is on ${selfHost}, the site of the article under review.`;
  } else if (!policy.isAllowed(candidate.sourceType)) {
    candidate.rejectReason = RejectReason.SOURCE_TYPE_BLOCKED;
    candidate.rejectDetail = `The source type ${candidate.sourceType} is not evidence.`;
  } else if (
    candidate.sourceType === SourceType.CODE_REPOSITORY &&
    !policy.isTrustedRepository(url, subject)
  ) {
    candidate.rejectReason = RejectReason.SOURCE_TYPE_BLOCKED;
    candidate.rejectDetail = "The repository owner is not on the trusted list.";
  }
  return candidate;
}

/** Return the candidate pages for one claim, in the fixed source order. */
export function collectCandidates(options: DiscoverOptions): Candidate[] {
  const { claimId, claimText, claimSubject, plan, policy, maxCandidatesPerClaim } = options;
  const candidates: Candidate[] = [];
  const seen = new Set<string>();
  const selfHost = options.articleUrl?.startsWith("http") ? hostOf(options.articleUrl) : "";
  const subject = policy.matchSubject(claimSubject) ?? policy.matchSubject(claimText);

  const add = (url: string, origin: Candidate["origin"], rank?: number | null): void => {
    if (!url.startsWith("http")) return;
    const key = canonicalUrl(url);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(
      makeCandidate({ claimId, url, policy, origin, rank: rank ?? null, selfHost, subject }),
    );
  };

  for (const url of plan.directUrls) add(url, "direct_url");
  for (const url of options.manualUrls ?? []) add(url, "manual");
  for (const hit of options.searchHits ?? []) {
    const open = candidates.filter((candidate) => candidate.rejectReason === null).length;
    if (open >= maxCandidatesPerClaim) break;
    add(hit.url, "search", hit.rank ?? null);
  }
  return candidates;
}

/** Sort the candidates so that the pipeline checks the best page first. */
export function orderCandidates(candidates: Candidate[], policy: Policy): Candidate[] {
  const originBonus: Record<Candidate["origin"], number> = {
    direct_url: 0.15,
    manual: 0.1,
    search: 0,
  };

  return [...candidates].sort((a, b) => {
    const keyOf = (candidate: Candidate): number =>
      -(
        candidate.tierWeight +
        (originBonus[candidate.origin] ?? 0) -
        (policy.isFallbackOnly(candidate.sourceType) ? 0.2 : 0)
      );
    const left = keyOf(a);
    const right = keyOf(b);
    if (left !== right) return left - right;
    return (a.searchRank ?? 0) - (b.searchRank ?? 0);
  });
}
