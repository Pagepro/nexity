/**
 * Gate checks.
 *
 * Each check here mirrors a Python check in `tests/test_verify.py`. Every one
 * of them holds a fault that a live run on a Pagepro article exposed.
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { loadPolicy } from "../src/policy.js";
import { ClaimKind, RejectReason, SourceType, Verdict, type EvidencePlan } from "../src/models.js";
import {
  applyVerdict,
  preJudgeGates,
  relevantExcerpt,
  EXCERPT_PASSAGES,
  PASSAGE_SEPARATOR,
  type CandidateInput,
  type ModelVerdict,
} from "../src/verify.js";
import { quoteIsInPage } from "../src/textops.js";
import { WEIGHT_CONFIDENCE, WEIGHT_ORIGIN, WEIGHT_TIER } from "../src/rank.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const policy = loadPolicy(join(REPO_ROOT, "policies"), ["core", "software", "web-stack"]);

const PAGE =
  "Node.js 22 entered the active long term support line in October 2024. " +
  "The release line stays supported until April 2027.";

function plan(overrides: Partial<EvidencePlan> = {}): EvidencePlan {
  return {
    claimId: "c1",
    requiredTerms: ["Node.js"],
    requiredValues: ["22"],
    preferredDomains: [],
    directUrls: [],
    queries: [],
    ...overrides,
  };
}

function candidate(
  url = "https://nodejs.org/en/blog/release/v22",
  sourceType: SourceType = SourceType.OFFICIAL_RELEASE,
  domain = "nodejs.org",
): CandidateInput {
  return { url, domain, sourceType };
}

describe("gates before the model", () => {
  it("passes an official page that states the value", () => {
    expect(preJudgeGates({ candidate: candidate(), plan: plan(), pageText: PAGE, policy })).toBeNull();
  });

  it("refuses a page that states a different value", () => {
    const rejection = preJudgeGates({
      candidate: candidate(),
      plan: plan({ requiredValues: ["22.11.0"] }),
      pageText: "Node.js 20.11.0 is the current release.",
      policy,
    });
    expect(rejection?.reason).toBe(RejectReason.VALUE_MISMATCH);
    expect(rejection?.detail).toContain("22.11.0");
  });

  it("refuses a page that names none of the required terms", () => {
    const rejection = preJudgeGates({
      candidate: candidate(),
      plan: plan({ requiredTerms: ["Deno"], requiredValues: [] }),
      pageText: PAGE,
      policy,
    });
    expect(rejection?.reason).toBe(RejectReason.REQUIRED_TERM_MISSING);
  });

  it("refuses a page whose source type is not evidence", () => {
    const rejection = preJudgeGates({
      candidate: candidate(
        "https://stackoverflow.com/questions/1",
        SourceType.USER_GENERATED,
        "stackoverflow.com",
      ),
      plan: plan(),
      pageText: PAGE,
      policy,
    });
    expect(rejection?.reason).toBe(RejectReason.SOURCE_TYPE_BLOCKED);
  });

  it("refuses a training company blog for a vendor claim", () => {
    // The live run accepted quickstart.com for a Bootstrap claim.
    const rejection = preJudgeGates({
      candidate: candidate(
        "https://www.quickstart.com/blog/bootstrap",
        SourceType.GENERAL_WEB,
        "www.quickstart.com",
      ),
      plan: plan({
        requiredTerms: ["Bootstrap"],
        requiredValues: [],
        preferredDomains: ["getbootstrap.com", "github.com/twbs"],
      }),
      pageText: "Bootstrap is a popular open-source CSS framework.",
      policy,
    });
    expect(rejection?.reason).toBe(RejectReason.NON_AUTHORITATIVE);
    expect(rejection?.detail).toContain("getbootstrap.com");
  });

  it("passes the vendor page for the same claim", () => {
    const rejection = preJudgeGates({
      candidate: candidate("https://getbootstrap.com/docs/", SourceType.OFFICIAL_DOCS, "getbootstrap.com"),
      plan: plan({
        requiredTerms: ["Bootstrap"],
        requiredValues: [],
        preferredDomains: ["getbootstrap.com", "github.com/twbs"],
      }),
      pageText: "Bootstrap is a popular open-source CSS framework.",
      policy,
    });
    expect(rejection).toBeNull();
  });

  it("keeps the general web when no vendor is known", () => {
    const rejection = preJudgeGates({
      candidate: candidate("https://some-site.example/post", SourceType.GENERAL_WEB, "some-site.example"),
      plan: plan({ requiredTerms: ["Bootstrap"], requiredValues: [], preferredDomains: [] }),
      pageText: "Bootstrap is a popular open-source CSS framework.",
      policy,
    });
    expect(rejection).toBeNull();
  });

  it("can switch the authority gate off", () => {
    const rejection = preJudgeGates({
      candidate: candidate(
        "https://www.quickstart.com/blog/bootstrap",
        SourceType.GENERAL_WEB,
        "www.quickstart.com",
      ),
      plan: plan({
        requiredTerms: ["Bootstrap"],
        requiredValues: [],
        preferredDomains: ["getbootstrap.com"],
      }),
      pageText: "Bootstrap is a popular open-source CSS framework.",
      policy,
      limits: { requireOfficialSourceForKnownSubject: false, maxQuoteChars: 400 },
    });
    expect(rejection).toBeNull();
  });
});

describe("validation of the model answer", () => {
  const answer = {
    verdict: Verdict.SUPPORTS,
    confidence: 0.93,
    quote: "Node.js 22 entered the active long term support line in October 2024.",
    reasoning: "The page states the version and the month.",
    sameContext: true,
    coversFullClaim: true,
    quoteSelfContained: true,
    currencyStatus: "current" as const,
  };

  it("accepts a real quote from an official page", () => {
    const outcome = applyVerdict({ candidate: candidate(), pageText: PAGE, answer, policy });
    expect(outcome.accepted).toBe(true);
    expect(outcome.rejection).toBeNull();
  });

  it("refuses an invented quote", () => {
    const outcome = applyVerdict({
      candidate: candidate(),
      pageText: PAGE,
      answer: { ...answer, quote: "The Node.js board confirmed the schedule in a private meeting." },
      policy,
    });
    expect(outcome.accepted).toBe(false);
    expect(outcome.rejection?.reason).toBe(RejectReason.QUOTE_NOT_IN_PAGE);
  });

  it("refuses a low confidence general page", () => {
    const outcome = applyVerdict({
      candidate: candidate("https://some-blog.example/node", SourceType.GENERAL_WEB, "some-blog.example"),
      pageText: PAGE,
      answer: { ...answer, confidence: 0.8 },
      policy,
    });
    expect(outcome.accepted).toBe(false);
    expect(outcome.rejection?.reason).toBe(RejectReason.BELOW_TIER_THRESHOLD);
  });

  it("records a contradiction with its own reason", () => {
    const outcome = applyVerdict({
      candidate: candidate(),
      pageText: PAGE,
      answer: { ...answer, verdict: Verdict.CONTRADICTS, reasoning: "The page states a different month." , sameContext: true, coversFullClaim: true, quoteSelfContained: true, currencyStatus: "current" },
      policy,
    });
    expect(outcome.rejection?.reason).toBe(RejectReason.ENTAILMENT_CONTRADICTS);
    expect(outcome.rejection?.detail).toContain("different month");
  });

  it("records an insufficient verdict", () => {
    const outcome = applyVerdict({
      candidate: candidate(),
      pageText: PAGE,
      answer: { ...answer, verdict: Verdict.INSUFFICIENT },
      policy,
    });
    expect(outcome.rejection?.reason).toBe(RejectReason.ENTAILMENT_INSUFFICIENT);
  });

  it("cuts a long quote to the limit", () => {
    const outcome = applyVerdict({
      candidate: candidate(),
      pageText: PAGE,
      answer: { ...answer, quote: "x".repeat(900) },
      policy,
      limits: { requireOfficialSourceForKnownSubject: true, maxQuoteChars: 400 },
    });
    expect(outcome.quote.length).toBeLessThanOrEqual(400);
  });
});

describe("the quote must carry the claim", () => {
  const plan = {
    requiredValues: [],
    requiredTerms: ["structured data", "Bypass", "HTML", "CMS"],
  };
  const page =
    "Test your structured data. Google recommends that you start with the Rich " +
    "Results Test to see what Google rich results can be generated for your page.";

  function judge(quote: string, planned = plan) {
    return applyVerdict({
      candidate: {
        url: "https://developers.google.com/search/docs/appearance/structured-data",
        domain: "developers.google.com",
        sourceType: SourceType.OFFICIAL_DOCS,
      },
      pageText: page,
      plan: planned,
      answer: { verdict: Verdict.SUPPORTS, confidence: 0.9, quote, reasoning: "" , sameContext: true, coversFullClaim: true, quoteSelfContained: true, currencyStatus: "current" },
      policy,
    });
  }

  it("warns, and never blocks, when the quote names nothing the claim asks for", () => {
    // This was a rejection until a measurement showed the rule cannot answer
    // the question. On a real claim the quote that documents the mechanism
    // shared one word with the claim, and a quote that did not share four.
    const outcome = judge(
      "Google recommends that you start with the Rich Results Test to see what Google rich results can be generated for your page.",
    );
    expect(outcome.accepted).toBe(true);
    expect(outcome.quoteCarriesClaim).toBe(false);
  });

  it("never blocks a good source whose quote uses other words", () => {
    // The official help page of the Rich Results Test documents the Code
    // option in words that share almost nothing with the claim. The gate used
    // to reject it, which lost the best source of the run.
    const outcome = applyVerdict({
      candidate: {
        url: "https://support.google.com/webmasters/answer/7445569",
        domain: "support.google.com",
        sourceType: SourceType.OFFICIAL_DOCS,
      },
      pageText: "For a code snippet You can test an arbitrary code snippet using this tool.",
      plan,
      answer: {
        verdict: Verdict.SUPPORTS,
        confidence: 0.92,
        quote: "You can test an arbitrary code snippet using this tool.",
        reasoning: "", sameContext: true, coversFullClaim: true, quoteSelfContained: true, currencyStatus: "current" },
      policy,
    });
    expect(outcome.accepted).toBe(true);
  });

  it("reports no warning when the quote carries a required term", () => {
    const outcome = judge("Test your structured data.");
    expect(outcome.accepted).toBe(true);
    expect(outcome.quoteCarriesClaim).toBe(true);
  });

  it("stays quiet when the claim asks for nothing", () => {
    const outcome = judge("Test your structured data.", {
      requiredValues: [],
      requiredTerms: [],
    });
    expect(outcome.accepted).toBe(true);
    expect(outcome.quoteCarriesClaim).toBe(true);
  });

  it("runs after the quote gate, never before it", () => {
    // An invented quote must still fail as an invented quote, so the report
    // names the real fault.
    const outcome = judge("Cypress requires Node.js 20, 22 and 24.");
    expect(outcome.rejection?.reason).toBe(RejectReason.QUOTE_NOT_IN_PAGE);
  });
});

describe("a contradiction must rest on a real quote", () => {
  const page = "Structured data makes a page eligible for a rich result.";
  function judge(quote: string) {
    return applyVerdict({
      candidate: {
        url: "https://developers.google.com/search/docs/appearance/ai-features",
        domain: "developers.google.com",
        sourceType: SourceType.OFFICIAL_DOCS,
      },
      pageText: page,
      answer: { verdict: Verdict.CONTRADICTS, confidence: 0.9, quote, reasoning: "It denies the claim." , sameContext: true, coversFullClaim: true, quoteSelfContained: true, currencyStatus: "current" },
      policy,
    });
  }

  it("refuses an invented quote instead of reporting a contradiction", () => {
    // A contradiction tells a person to change a published article. The check
    // used to be skipped here, because the branch returned before the quote
    // gate ran.
    const outcome = judge("Google requires component based content for AI Mode.");
    expect(outcome.rejection?.reason).toBe(RejectReason.QUOTE_NOT_IN_PAGE);
    expect(outcome.rejection?.detail).toContain("unverified quote");
  });

  it("reports the contradiction when the quote is in the page", () => {
    const outcome = judge("Structured data makes a page eligible for a rich result.");
    expect(outcome.rejection?.reason).toBe(RejectReason.ENTAILMENT_CONTRADICTS);
  });

  it("still reports a contradiction that carries no quote", () => {
    expect(judge("").rejection?.reason).toBe(RejectReason.ENTAILMENT_CONTRADICTS);
  });
});

describe("the four answers of the judge", () => {
  const page =
    "The Vercel Pro plan includes one million edge requests each month. " +
    "The Enterprise plan is priced on request.";
  const good = {
    verdict: Verdict.SUPPORTS,
    confidence: 0.9,
    quote: "The Vercel Pro plan includes one million edge requests each month.",
    reasoning: "",
    sameContext: true,
    coversFullClaim: true,
    quoteSelfContained: true,
    currencyStatus: "current",
  } satisfies ModelVerdict;
  const judge = (over: Partial<ModelVerdict>) =>
    applyVerdict({
      candidate: {
        url: "https://vercel.com/docs/limits",
        domain: "vercel.com",
        sourceType: SourceType.OFFICIAL_DOCS,
      },
      pageText: page,
      answer: { ...good, ...over },
      policy,
    });

  it("accepts when all four answers pass", () => {
    expect(judge({}).accepted).toBe(true);
  });

  it("refuses a page about another product or plan", () => {
    const outcome = judge({ sameContext: false });
    expect(outcome.rejection?.reason).toBe(RejectReason.OFF_CONTEXT);
  });

  it("refuses a page that proves only part of the claim", () => {
    const outcome = judge({ coversFullClaim: false });
    expect(outcome.rejection?.reason).toBe(RejectReason.PARTIAL_CLAIM);
  });

  it("refuses a quote that leans on text outside itself", () => {
    const outcome = judge({ quoteSelfContained: false });
    expect(outcome.rejection?.reason).toBe(RejectReason.QUOTE_NOT_SELF_CONTAINED);
  });

  it("refuses a page whose state is outdated or unclear", () => {
    expect(judge({ currencyStatus: "outdated" }).rejection?.reason).toBe(
      RejectReason.SOURCE_NOT_CURRENT,
    );
    expect(judge({ currencyStatus: "unclear" }).rejection?.reason).toBe(
      RejectReason.SOURCE_NOT_CURRENT,
    );
  });

  it("accepts a claim that is openly about the past", () => {
    expect(judge({ currencyStatus: "historical_match" }).accepted).toBe(true);
    expect(judge({ currencyStatus: "not_applicable" }).accepted).toBe(true);
  });

  it("reads a missing answer as the safe value, never as a pass", () => {
    // An older judge file must not slip through a gate by leaving a field out.
    const outcome = applyVerdict({
      candidate: {
        url: "https://vercel.com/docs/limits",
        domain: "vercel.com",
        sourceType: SourceType.OFFICIAL_DOCS,
      },
      pageText: page,
      answer: {
        verdict: Verdict.SUPPORTS,
        confidence: 0.9,
        quote: good.quote,
        reasoning: "",
      },
      policy,
    });
    expect(outcome.accepted).toBe(false);
    expect(outcome.rejection?.reason).toBe(RejectReason.OFF_CONTEXT);
  });

  it("runs the quote gate before the four answers", () => {
    // An invented quote must still fail as an invented quote.
    const outcome = judge({ quote: "Vercel gives every plan unlimited requests.", sameContext: false });
    expect(outcome.rejection?.reason).toBe(RejectReason.QUOTE_NOT_IN_PAGE);
  });
});

describe("authority beats confidence in the rank", () => {
  it("puts a fallback source below a first-party one", () => {
    const docs = { sourceType: SourceType.OFFICIAL_DOCS, tierWeight: 1, confidence: 0.75 };
    const web = { sourceType: SourceType.GENERAL_WEB, tierWeight: 0.4, confidence: 0.99 };
    const scoreOf = (c: { tierWeight: number; confidence: number }) =>
      WEIGHT_TIER * c.tierWeight + WEIGHT_CONFIDENCE * c.confidence + WEIGHT_ORIGIN * 0.5;
    expect(scoreOf(docs)).toBeGreaterThan(scoreOf(web));
  });
});

describe("the excerpt of a long page", () => {
  // The page that a live run mishandled: the claim says 180 days, the page
  // says one year, and the page says it far from every mention of "180".
  const filler = "Submitting a sitemap can help make the discovery process quicker. ".repeat(120);
  const page =
    "Site moves and migrations. A site move with URL changes needs a redirect. " +
    "The number 180 appears here in a passage about the Search Console change of address tool. " +
    filler +
    "Keep the redirects for as long as possible, generally at least 1 year. " +
    "This timeframe allows Google to transfer all signals to the new URLs. " +
    filler;
  const claim =
    "Google officially recommends keeping 301 redirects active for at least 180 days, " +
    "giving crawlers enough time to discover and process the new destination URLs.";
  const plan = { requiredValues: ["180"], requiredTerms: ["Google"] };

  it("shows the passage that denies the claim, not only the one that repeats its number", () => {
    const excerpt = relevantExcerpt(page, plan, 3000, claim);
    expect(excerpt).toContain("generally at least 1 year");
  });

  it("returns several passages for a long page", () => {
    const excerpt = relevantExcerpt(page, plan, 3000, claim);
    expect(excerpt.split(PASSAGE_SEPARATOR).length).toBeGreaterThan(1);
    expect(excerpt.split(PASSAGE_SEPARATOR).length).toBeLessThanOrEqual(EXCERPT_PASSAGES);
  });

  it("never grows past the character budget", () => {
    const excerpt = relevantExcerpt(page, plan, 3000, claim);
    expect(excerpt.length).toBeLessThanOrEqual(3000);
  });

  it("returns a short page whole", () => {
    expect(relevantExcerpt("A short page.", plan, 3000, claim)).toBe("A short page.");
  });

  it("does not by itself stop a quote stitched from two passages", () => {
    // This records a real limit rather than a wish. `quoteIsInPage` falls back
    // to a check of each sentence, so a quote built from one real sentence of
    // each passage passes. That fallback rescued a true source once, so it
    // stays. The rule in the skill file and the `quoteSelfContained` answer of
    // the judge are what stop a stitched quote.
    const stitched =
      "Site moves and migrations. Keep the redirects for as long as possible, generally at least 1 year.";
    expect(quoteIsInPage(stitched, page)).toBe(true);
  });
});

describe("the repository of the product owner", () => {
  const plan: EvidencePlan = {
    claimId: "c1",
    requiredTerms: ["Contentful"],
    requiredValues: [],
    preferredDomains: ["www.contentful.com"],
    directUrls: [],
    queries: [],
  };
  const page = "contentful space import Skip importing content types and locales for Contentful.";

  function gate(url: string, subject?: string) {
    return preJudgeGates({
      candidate: { url, domain: new URL(url).hostname, sourceType: SourceType.CODE_REPOSITORY },
      plan,
      pageText: page,
      policy,
      ...(subject === undefined ? {} : { subject }),
    });
  }

  it("accepts the official repository of the subject", () => {
    // `discover.ts` already trusted this address. This gate refused it, so the
    // official CLI repository of a vendor was blocked as having no authority
    // about that vendor, and a live run lost the evidence for two claims.
    expect(gate("https://github.com/contentful/contentful-cli/blob/main/README.md", "Contentful")).toBeNull();
  });

  it("still refuses a repository with an unknown owner", () => {
    const rejection = gate("https://github.com/some-person/fork/blob/main/README.md", "Contentful");
    expect(rejection?.reason).toBe(RejectReason.NON_AUTHORITATIVE);
  });

  it("keeps refusing an unrelated host", () => {
    const rejection = preJudgeGates({
      candidate: { url: "https://blog.example/post", domain: "blog.example", sourceType: SourceType.GENERAL_WEB },
      plan,
      pageText: page,
      policy,
      subject: "Contentful",
    });
    expect(rejection?.reason).toBe(RejectReason.NON_AUTHORITATIVE);
  });
});

describe("an industry measurement for a statistic", () => {
  // A live run refused W3Techs for "It powers more than 40% of all websites",
  // because the claim names WordPress. The share is a measurement, and
  // wordpress.org itself quotes W3Techs.
  const plan: EvidencePlan = {
    claimId: "c02",
    requiredTerms: ["WordPress"],
    requiredValues: ["43%"],
    preferredDomains: ["wordpress.org", "make.wordpress.org"],
    directUrls: [],
    queries: [],
  };
  const page = "WordPress is used by 43% of all the websites.";
  const url = "https://w3techs.com/technologies/details/cm-wordpress";
  const w3techs: CandidateInput = { url, domain: "w3techs.com", sourceType: SourceType.INDUSTRY_SOURCE };

  function gate(claimKind: ClaimKind | undefined, input: CandidateInput = w3techs) {
    return preJudgeGates({ candidate: input, plan, pageText: page, policy, subject: "WordPress", claimKind });
  }

  it("classifies W3Techs as an industry source", () => {
    expect(policy.classify(url)).toBe(SourceType.INDUSTRY_SOURCE);
  });

  it("passes an industry source for a statistic", () => {
    expect(gate(ClaimKind.STATISTIC)).toBeNull();
  });

  it("still refuses it for a claim about what the product does or costs", () => {
    for (const kind of [ClaimKind.PRICE, ClaimKind.FEATURE_NAME, ClaimKind.OTHER, undefined]) {
      expect(gate(kind)?.reason).toBe(RejectReason.NON_AUTHORITATIVE);
    }
  });

  it("never lets a general page through as a statistic", () => {
    const blog: CandidateInput = { url: "https://stats-blog.example/wp", domain: "stats-blog.example", sourceType: SourceType.GENERAL_WEB };
    expect(gate(ClaimKind.STATISTIC, blog)?.reason).toBe(RejectReason.NON_AUTHORITATIVE);
  });
});

describe("the term gate and the page title", () => {
  // The official Workspaces page says "DevTools" in its text and "Chrome
  // DevTools" only in its title. The gate refused the product's own page.
  const plan: EvidencePlan = {
    claimId: "c02",
    requiredTerms: ["Chrome DevTools"],
    requiredValues: [],
    preferredDomains: ["developer.chrome.com"],
    directUrls: [],
    queries: [],
  };
  const page = "Save changes you make in DevTools back to source files on your computer by setting up a workspace.";
  const workspaces: CandidateInput = {
    url: "https://developer.chrome.com/docs/devtools/workspaces",
    domain: "developer.chrome.com",
    sourceType: SourceType.OFFICIAL_DOCS,
  };

  it("finds the term in the title", () => {
    const rejection = preJudgeGates({
      candidate: workspaces,
      plan,
      pageText: page,
      policy,
      pageTitle: "Set up workspaces to save changes to source files | Chrome DevTools | Chrome for Developers",
    });
    expect(rejection).toBeNull();
  });

  it("still refuses a page that names the term nowhere", () => {
    const rejection = preJudgeGates({ candidate: workspaces, plan, pageText: page, policy, pageTitle: "Workspaces" });
    expect(rejection?.reason).toBe(RejectReason.REQUIRED_TERM_MISSING);
  });
});

describe("the excerpt and a word that the page repeats", () => {
  // The Netlify page repeats "redirect" in every passage, so the window that
  // states the default status code scored no higher than the rest and stayed
  // out of the excerpt. The run then reported no source for a documented fact.
  const filler =
    "Redirects and rewrites let you send one path to another path with a redirect rule. ".repeat(80);
  const key = "In a _redirects file, the default status for a rule with no code is 301. ";
  const page = `${filler}${key}${filler}`;

  it("prefers the passage with the rare term over one that repeats a common word", () => {
    const excerpt = relevantExcerpt(
      page,
      { requiredValues: ["301"], requiredTerms: ["_redirects", "redirect"] },
      1500,
      "Netlify reads them from a _redirects file, where a rule returns a 301 by default.",
    );
    expect(excerpt).toContain("the default status for a rule with no code is 301");
  });

  it("keeps the excerpt inside the budget", () => {
    const excerpt = relevantExcerpt(page, { requiredValues: ["301"], requiredTerms: [] }, 1500, "");
    expect(excerpt.length).toBeLessThanOrEqual(1500);
  });
});
