/**
 * Checks for the ranking, the budget, the discovery, and the claim filters.
 *
 * Each check mirrors a Python check. The limit checks matter most: a parameter
 * named as a goal must never work as a cap.
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { loadPolicy } from "../src/policy.js";
import {
  ClaimKind,
  RejectReason,
  SourceType,
  type Candidate,
  type ClaimResult,
  type EvidencePlan,
} from "../src/models.js";
import { applyTotalCap, meetsTarget, scoreCandidate, selectBest } from "../src/rank.js";
import { SearchBudget } from "../src/budget.js";
import { collectCandidates, orderCandidates } from "../src/discover.js";
import { anchorClaims, isTableRow } from "../src/extract.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const policy = loadPolicy(join(REPO_ROOT, "policies"), ["core", "software", "web-stack"]);

function emptyPlan(overrides: Partial<EvidencePlan> = {}): EvidencePlan {
  return {
    claimId: "c1",
    requiredTerms: [],
    requiredValues: [],
    preferredDomains: [],
    directUrls: [],
    queries: [],
    ...overrides,
  };
}

function acceptedCandidate(claimId: string, confidence: number): Candidate {
  const url = `https://docs.example/${claimId}`;
  return {
    claimId,
    url,
    canonicalUrl: url,
    domain: "docs.example",
    sourceType: SourceType.OFFICIAL_DOCS,
    tierWeight: 1,
    origin: "search",
    searchRank: null,
    fetchStatus: null,
    pageTitle: "",
    publishedAt: null,
    modifiedAt: null,
    isLivingDocument: true,
    temporalRelation: null,
    quote: "",
    verdict: null,
    confidence,
    reasoning: "",
    valueMatch: false,
    quoteCarriesClaim: true,
    sameContext: true,
    coversFullClaim: true,
    quoteSelfContained: true,
    currencyStatus: "current",
    score: 0,
    accepted: true,
    rejectReason: null,
    rejectDetail: "",
  };
}

function resultWith(claimId: string, confidence: number): ClaimResult {
  const candidate = acceptedCandidate(claimId, confidence);
  candidate.score = scoreCandidate(candidate);
  const result: ClaimResult = {
    claim: {
      id: claimId,
      text: `Claim ${claimId}`,
      kind: ClaimKind.OTHER,
      subject: "",
      anchorMethod: "exact",
      span: null,
      anchorScore: 100,
    },
    plan: emptyPlan({ claimId }),
    accepted: null,
    rejected: [],
  };
  return selectBest(result, [candidate]);
}

describe("the two source-count limits", () => {
  it("never removes a verified source to meet the soft goal", () => {
    const results = [0, 1, 2, 3, 4, 5].map((index) => resultWith(`c${index}`, 0.9));
    expect(results.filter((result) => result.accepted).length).toBe(6);
    expect(meetsTarget(results, 3)).toBe(true);
  });

  it("only reports a gap against the soft goal", () => {
    const results = [0, 1].map((index) => resultWith(`c${index}`, 0.9));
    expect(results.filter((result) => result.accepted).length).toBe(2);
    expect(meetsTarget(results, 5)).toBe(false);
  });

  it("treats a cap of zero as no cap", () => {
    const results = [0, 1, 2, 3, 4, 5].map((index) => resultWith(`c${index}`, 0.9));
    expect(applyTotalCap(results, 0)).toBe(0);
    expect(results.filter((result) => result.accepted).length).toBe(6);
  });

  it("caps the total and states the cause", () => {
    const results = [
      resultWith("c1", 0.95),
      resultWith("c2", 0.9),
      resultWith("c3", 0.85),
    ];
    expect(applyTotalCap(results, 2)).toBe(1);
    expect(results.filter((result) => result.accepted).length).toBe(2);

    const dropped = results.find((result) => !result.accepted)!;
    expect(dropped.rejected[0]!.rejectReason).toBe(RejectReason.OVER_TOTAL_CAP);
    expect(dropped.rejected[0]!.rejectDetail).toContain("max_sources_total");
  });

  it("keeps every other candidate in the rejected list", () => {
    const first = acceptedCandidate("c1", 0.95);
    const second = acceptedCandidate("c1", 0.7);
    const result = selectBest(
      { claim: resultWith("c1", 0.9).claim, plan: emptyPlan(), accepted: null, rejected: [] },
      [first, second],
    );
    expect(result.accepted).toBe(first);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]!.rejectDetail).toContain("Not selected");
  });
});

describe("search budget", () => {
  it("refuses a call after the limit", () => {
    const budget = new SearchBudget(2, "web-search");
    expect(budget.take()).toBe(true);
    expect(budget.take()).toBe(true);
    expect(budget.take()).toBe(false);
    expect(budget.exhausted).toBe(true);

    const report = budget.report();
    expect(report.searchCallsUsed).toBe(2);
    expect(report.exhausted).toBe(true);
  });

  it("returns a call that never reached the provider", () => {
    const budget = new SearchBudget(2, "web-search");
    budget.take();
    budget.refund();
    expect(budget.report().searchCallsUsed).toBe(0);
  });

  it("records the degraded reason", () => {
    const budget = new SearchBudget(0, "none");
    expect(budget.take()).toBe(false);
    budget.markDegraded("Automatic search is off.");
    expect(budget.report().degraded).toBe(true);
    expect(budget.report().degradedReason).toContain("off");
  });
});

describe("candidate discovery", () => {
  const base = {
    claimId: "c1",
    claimText: "Node.js 22 became the active long term support release.",
    claimSubject: "Node.js",
    policy,
    maxCandidatesPerClaim: 6,
  };

  it("keeps the fixed source order", () => {
    const candidates = collectCandidates({
      ...base,
      plan: emptyPlan({ directUrls: ["https://nodejs.org/en/blog/release"] }),
      manualUrls: ["https://nodejs.org/en/about/previous-releases"],
      searchHits: [{ url: "https://endoflife.date/nodejs", rank: 0 }],
    });
    expect(candidates.map((candidate) => candidate.origin)).toEqual([
      "direct_url",
      "manual",
      "search",
    ]);
  });

  it("never lets the article prove itself", () => {
    const candidates = collectCandidates({
      ...base,
      plan: emptyPlan(),
      searchHits: [{ url: "https://pagepro.co/blog/other-post/", rank: 0 }],
      articleUrl: "https://pagepro.co/blog/react-native-version-upgrades-how-to-do-this/",
    });
    expect(candidates[0]!.rejectReason).toBe(RejectReason.SELF_CITATION);
    expect(candidates[0]!.rejectDetail).toContain("pagepro.co");
  });

  it("removes a duplicate address", () => {
    const candidates = collectCandidates({
      ...base,
      plan: emptyPlan({ directUrls: ["https://nodejs.org/en/about/"] }),
      searchHits: [{ url: "https://nodejs.org/en/about", rank: 0 }],
    });
    expect(candidates).toHaveLength(1);
  });

  it("blocks a repository with an unknown owner", () => {
    const candidates = collectCandidates({
      ...base,
      plan: emptyPlan(),
      searchHits: [{ url: "https://github.com/random-person/fork", rank: 0 }],
    });
    expect(candidates[0]!.rejectReason).toBe(RejectReason.SOURCE_TYPE_BLOCKED);
  });

  it("orders an official page before a general page", () => {
    const candidates = collectCandidates({
      ...base,
      plan: emptyPlan(),
      searchHits: [
        { url: "https://some-blog.example/node", rank: 0 },
        { url: "https://nodejs.org/en/about", rank: 1 },
      ],
    });
    const ordered = orderCandidates(candidates, policy);
    expect(ordered[0]!.domain).toBe("nodejs.org");
  });
});

describe("claim filters", () => {
  const article =
    "React Native 0.81 raised the minimum Node.js version to 20.19.4. " +
    "Our client had been postponing the update for over 2 years. " +
    "You can write your own test code in JavaScript and use it on every browser. " +
    "Vercel does not charge per user.";

  it("drops a claim that is not in the article", () => {
    const { claims, report } = anchorClaims(
      [
        { text: "React Native 0.81 raised the minimum Node.js version to 20.19.4.", subject: "React Native" },
        { text: "React Native 0.81 dropped support for Windows in 2023.", subject: "React Native" },
      ],
      article,
      policy,
      { maxClaims: 10 },
    );
    expect(claims.map((claim) => claim.text)).toEqual([
      "React Native 0.81 raised the minimum Node.js version to 20.19.4.",
    ]);
    expect(report.droppedUnanchored).toHaveLength(1);
  });

  describe("the kind of a claim", () => {
    // The agent writes text and subject only, so every claim of a live run
    // came out as `other`, and the authority gate could not tell a statistic.
    const share =
      "It powers more than 40% of all websites worldwide and holds around 60% of the CMS market share.";
    const overage = "Growth plan overages are billed at $1 per 250k additional API CDN requests.";
    const text = `${article} ${share} ${overage}`;

    function kindsOf(raw: { text: string; subject: string; kind?: string }[]) {
      return anchorClaims(raw, text, policy, { maxClaims: 10 }).claims.map((claim) => claim.kind);
    }

    it("reads a statistic although the version signal reads 'than 40' as a version", () => {
      expect(kindsOf([{ text: share, subject: "WordPress" }])).toEqual([ClaimKind.STATISTIC]);
    });

    it("keeps a price as a price when it also counts requests", () => {
      expect(kindsOf([{ text: overage, subject: "Sanity" }])).toEqual([ClaimKind.PRICE]);
    });

    it("keeps a version as a version", () => {
      expect(
        kindsOf([{ text: "React Native 0.81 raised the minimum Node.js version to 20.19.4.", subject: "React Native" }]),
      ).toEqual([ClaimKind.VERSION]);
    });

    it("keeps the kind that the agent states", () => {
      expect(kindsOf([{ text: share, subject: "WordPress", kind: "other" }])).toEqual([ClaimKind.OTHER]);
    });
  });

  it("drops a claim about the author's own client and names the marker", () => {
    const { report } = anchorClaims(
      [{ text: "Our client had been postponing the update for over 2 years.", subject: "React Native" }],
      article,
      policy,
      { maxClaims: 10 },
    );
    expect(report.droppedUnverifiable[0]).toContain("marker:");
    expect(report.droppedUnverifiable[0]).toContain("our client");
  });

  it("drops prose and keeps a pricing fact with no number", () => {
    const { claims, report } = anchorClaims(
      [
        { text: "You can write your own test code in JavaScript and use it on every browser.", subject: "" },
        { text: "Vercel does not charge per user.", subject: "Vercel" },
      ],
      article,
      policy,
      { maxClaims: 10 },
    );
    expect(claims.map((claim) => claim.text)).toEqual(["Vercel does not charge per user."]);
    expect(report.droppedProse).toHaveLength(1);
  });

  it("drops a pricing fact only in strict mode", () => {
    const raw = [{ text: "Vercel does not charge per user.", subject: "Vercel" }];
    const strict = anchorClaims(raw, article, policy, {
      maxClaims: 10,
      requireCheckableValue: true,
    });
    expect(strict.claims).toHaveLength(0);
    expect(strict.report.droppedNoValue).toHaveLength(1);
  });

  it("never treats a table row as a claim", () => {
    expect(isTableRow("| Aspect | Traditional Serverless | Vercel Fluid Compute |")).toBe(true);
    const { claims, report } = anchorClaims(
      [{ text: "| Aspect | Traditional Serverless | Vercel Fluid Compute |", subject: "" }],
      article,
      policy,
      { maxClaims: 10 },
    );
    expect(claims).toHaveLength(0);
    expect(report.droppedProse).toHaveLength(1);
  });

  it("respects the claim limit and says so", () => {
    const raw = [
      { text: "React Native 0.81 raised the minimum Node.js version to 20.19.4.", subject: "React Native" },
      { text: "Vercel does not charge per user.", subject: "Vercel" },
    ];
    const { claims, report } = anchorClaims(raw, article, policy, { maxClaims: 1 });
    expect(claims).toHaveLength(1);
    expect(report.truncatedToLimit).toBe(true);
  });
});

describe("the age of a source in the rank", () => {
  function dated(relation: Candidate["temporalRelation"]): Candidate {
    const candidate = acceptedCandidate("c1", 0.9);
    candidate.temporalRelation = relation;
    return candidate;
  }

  it("ranks the current page above the older page", () => {
    // The article cited a blog post from years back while the current
    // documentation of the same vendor said the same thing.
    const living = scoreCandidate(dated("living"));
    const older = scoreCandidate(dated("source_older"));
    expect(living).toBeGreaterThan(older);
  });

  it("never rejects an older page, it only lowers the rank", () => {
    expect(scoreCandidate(dated("source_older"))).toBeGreaterThan(0);
  });

  it("gives a newer page the same rank as a living document", () => {
    expect(scoreCandidate(dated("source_newer"))).toBe(scoreCandidate(dated("living")));
  });

  it("keeps a searched page competitive with a guessed address", () => {
    // A direct address is a guess of the policy pack. A search result is a
    // page found for this claim, so the gap must stay small.
    const guessed = acceptedCandidate("c1", 0.9);
    guessed.origin = "direct_url";
    const searched = acceptedCandidate("c1", 0.9);
    searched.origin = "search";
    expect(scoreCandidate(guessed) - scoreCandidate(searched)).toBeLessThan(0.05);
  });
});
