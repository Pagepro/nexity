/**
 * The command surface of the source reviewer.
 *
 * The skill runs one command per step. Each command does the deterministic
 * work and writes the state. Between two commands the agent does the work that
 * needs a model: it proposes claims, it runs the search tool, and it reads a
 * page to answer one question.
 *
 * ## The rule that the split protects
 *
 * The agent proposes. The code decides. Every gate that keeps citation quality
 * lives here, in code that the agent cannot skip:
 *
 * - `claims` drops a claim that is not in the article text,
 * - `candidates` drops a source type that is not evidence,
 * - `pages` runs the value gate and the term gate before the model reads,
 * - `verdict` checks that the quote is in the page.
 *
 * An agent that answers well makes the report better. An agent that answers
 * badly cannot make a bad source pass.
 *
 * Run `node dist/cli.js help` for the command list.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, isAbsolute, join, resolve } from "node:path";

import { SearchBudget } from "./budget.js";
import { loadFactBank, matchProof } from "./brain.js";
import { collectCandidates, orderCandidates, type SearchHit } from "./discover.js";
import { anchorClaims, type RawClaim } from "./extract.js";
import { buildPlan } from "./evidencePlan.js";
import { fetchPage, MIN_PAGE_CHARS } from "./http.js";
import { extractMainText } from "./fetch.js";
import { CurrencyStatus, FetchStatus, RejectReason, Verdict, type Candidate } from "./models.js";
import { loadPolicy, type Policy } from "./policy.js";
import { markdownReport, reviewVerdict } from "./report.js";
import { applyTotalCap, scoreCandidate, selectBest } from "./rank.js";
import {
  addError,
  DEFAULT_SETTINGS,
  emptyState,
  loadState,
  proofRecord,
  readArticle,
  readPage,
  saveState,
  toDate,
  writeArticle,
  writePage,
  type RunSettings,
  type RunState,
} from "./run.js";
import { temporalRelation, versionScopeOk } from "./contradiction.js";
import { isExternalLink, linksInSpan, readLinks } from "./links.js";
import { needsNoSource, readSections, sectionAt } from "./sections.js";
import {
  applyVerdict,
  AUTHORITATIVE_TYPES,
  MAX_PAGE_CHARS_FOR_JUDGE,
  preJudgeGates,
  relevantExcerpt,
} from "./verify.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const POLICY_DIR = join(REPO_ROOT, "policies");

/**
 * The smallest number of searches for a claim that finds nothing at first.
 *
 * A run that spends four calls out of thirty reports a missing source that a
 * fifth call would have found. The number reaches the agent in the rules of
 * `search-brief.json`.
 */
export const MIN_QUERIES_PER_CLAIM = 3;

/** The excerpt that the agent reads to judge one page. */
export const EXCERPT_CHARS = MAX_PAGE_CHARS_FOR_JUDGE;

interface Args {
  positional: string[];
  flags: Map<string, string>;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]!;
    if (!item.startsWith("--")) {
      positional.push(item);
      continue;
    }
    const at = item.indexOf("=");
    if (at > 0) {
      flags.set(item.slice(2, at), item.slice(at + 1));
    } else {
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        flags.set(item.slice(2), next);
        index += 1;
      } else {
        flags.set(item.slice(2), "true");
      }
    }
  }
  return { positional, flags };
}

function dirOf(args: Args): string {
  const value = args.flags.get("dir");
  if (!value) throw new Error("State the working folder with --dir.");
  return isAbsolute(value) ? value : resolve(process.cwd(), value);
}

function readJson<T>(path: string): T {
  const full = isAbsolute(path) ? path : resolve(process.cwd(), path);
  if (!existsSync(full)) throw new Error(`No file at ${full}.`);
  return JSON.parse(readFileSync(full, "utf-8")) as T;
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function policyOf(state: RunState): Policy {
  return loadPolicy(POLICY_DIR, state.settings.policyPacks);
}

function settingsFrom(args: Args): RunSettings {
  const settings: RunSettings = { ...DEFAULT_SETTINGS };
  const numbers: [keyof RunSettings, string][] = [
    ["targetSourceCount", "target-source-count"],
    ["maxSourcesTotal", "max-sources-total"],
    ["maxClaims", "max-claims"],
    ["maxQueriesPerClaim", "max-queries-per-claim"],
    ["maxCandidatesPerClaim", "max-candidates-per-claim"],
    ["maxSearchCallsPerRun", "max-search-calls"],
  ];
  for (const [key, flag] of numbers) {
    const raw = args.flags.get(flag);
    if (raw === undefined) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) throw new Error(`--${flag} needs a number of zero or more.`);
    (settings[key] as number) = value;
  }
  if (args.flags.get("strict") === "true") settings.requireCheckableValue = true;
  const packs = args.flags.get("packs");
  if (packs) settings.policyPacks = packs.split(",").map((name) => name.trim()).filter(Boolean);
  const brain = args.flags.get("brain");
  if (brain) settings.brainRoot = isAbsolute(brain) ? brain : resolve(process.cwd(), brain);
  return settings;
}

// ---- start -------------------------------------------------------------------

async function commandStart(args: Args): Promise<void> {
  const ref = args.positional[1];
  if (!ref) throw new Error("State the article as a URL or as a file path.");
  const dir = dirOf(args);
  const settings = settingsFrom(args);
  const state = emptyState(ref, settings);

  let text = "";
  if (ref.startsWith("http://") || ref.startsWith("https://")) {
    const page = await fetchPage(ref, { minPageChars: MIN_PAGE_CHARS });
    if (page.status !== FetchStatus.OK) {
      throw new Error(`The article did not load: ${page.status}. ${page.detail}`);
    }
    text = page.text;
    state.title = page.title;
    state.sections = readSections(page.html, page.text);
    state.links = readLinks(page.html, page.text);
    // The publication date must come from the page. A build date would make a
    // current source look stale in the age check.
    if (page.publishedAt) state.publishedAt = page.publishedAt.toISOString().slice(0, 10);
  } else {
    const path = isAbsolute(ref) ? ref : resolve(process.cwd(), ref);
    if (!existsSync(path)) throw new Error(`No file at ${path}.`);
    const body = readFileSync(path, "utf-8");
    const extracted = extractMainText(body);
    text = extracted.text || body;
    state.title = extracted.title;
    state.sections = readSections(body, text);
    state.links = readLinks(body, text);
  }

  const date = args.flags.get("published-at");
  if (date) state.publishedAt = date;

  state.articleChars = text.length;
  state.step = "claims";
  writeArticle(dir, text);
  saveState(dir, state);

  console.log(`Run ${state.runId} started in ${dir}.`);
  console.log(`Article text: ${text.length} characters in article.txt.`);
  if (state.title) console.log(`Title: ${state.title}`);
  if (state.publishedAt) console.log(`Article date: ${state.publishedAt}`);
  console.log("");
  console.log(`Next: read article.txt, then write claims.json in ${dir} as`);
  console.log('  [{ "text": "<one sentence copied from the article>", "subject": "<product>" }]');
  console.log(`Then run: claims --dir ${dir}`);
}

// ---- claims ------------------------------------------------------------------

function commandClaims(args: Args): void {
  const dir = dirOf(args);
  const state = loadState(dir);
  const policy = policyOf(state);
  const article = readArticle(dir);
  const raw = readJson<RawClaim[]>(args.flags.get("in") ?? join(dir, "claims.json"));

  const { claims, report } = anchorClaims(raw, article, policy, {
    maxClaims: state.settings.maxClaims,
    requireCheckableValue: state.settings.requireCheckableValue,
  });
  state.claims = claims;
  state.extraction = report;
  state.plans = {};
  for (const claim of claims) {
    state.plans[claim.id] = buildPlan(claim, policy, state.settings.maxQueriesPerClaim);
  }

  // The brain proves a company result. The web cannot. A claim that the fact
  // bank states never reaches the search, so the run spends no call on it.
  state.internalProofs = [];
  state.factBankFiles = 0;
  if (state.settings.brainRoot) {
    const bank = loadFactBank(state.settings.brainRoot);
    state.factBankFiles = bank.length;
    if (bank.length === 0) {
      addError(state, "brain", state.settings.brainRoot, "The fact bank holds no active proof file.");
    }
    for (const claim of claims) {
      const match = matchProof(claim.text, bank);
      if (match) state.internalProofs.push(proofRecord(claim.id, match));
    }
  }

  // The section of a claim decides how the report reads it. A claim in an FAQ
  // block needs no external source, because the house style gives that block
  // no citation. The list of such sections is policy data.
  state.claimSections = {};
  state.noSourceClaimIds = [];
  for (const claim of claims) {
    const heading = sectionAt(state.sections, claim.span?.start ?? -1);
    state.claimSections[claim.id] = heading;
    if (needsNoSource(heading, policy.noSourceSections)) state.noSourceClaimIds.push(claim.id);
  }

  // A sentence that already links to a source needs no second link. The report
  // states the address that the article carries, so an editor can compare it
  // with the source this run found instead of adding a duplicate.
  state.claimLinks = {};
  for (const claim of claims) {
    const inSentence = linksInSpan(state.links, claim.span);
    state.claimLinks[claim.id] = inSentence.filter((link) =>
      isExternalLink(link.href, state.sourceRef),
    );
    // The link that the article already carries is the first page to check.
    // It passes the same gates as any other page, so a weak existing link is
    // reported rather than kept by default.
    const plan = state.plans[claim.id];
    if (plan) {
      const existing = (state.claimLinks[claim.id] ?? []).map((link) => link.href);
      plan.directUrls = [...new Set([...existing, ...plan.directUrls])];
    }
  }
  const linked = claims.filter((claim) => (state.claimLinks[claim.id] ?? []).length > 0);
  if (linked.length > 0) {
    console.log(`Claims that already carry a link: ${linked.length}`);
    for (const claim of linked) {
      for (const link of state.claimLinks[claim.id] ?? []) {
        console.log(`  - ${claim.id} -> ${link.href}`);
      }
    }
  }

  const provenIds = new Set([
    ...state.internalProofs.map((proof) => proof.claimId),
    ...state.noSourceClaimIds,
  ]);
  const toSearch = claims.filter((claim) => !provenIds.has(claim.id));

  state.candidates = [];
  state.step = "candidates";
  saveState(dir, state);

  // The rules travel with the data. A rule that lives only in the skill file
  // is far from the work and easy to skip.
  const items = toSearch.map((claim) => {
    const existingLinks = (state.claimLinks[claim.id] ?? []).map((link) => link.href);
    return {
      claimId: claim.id,
      claimText: claim.text,
      existingLinks,
      existingLinkIsOfficial: existingLinks.some((href) =>
        AUTHORITATIVE_TYPES.has(policy.classify(href)),
      ),
      directUrls: state.plans[claim.id]!.directUrls,
      queries: state.plans[claim.id]!.queries,
    };
  });
  const budgetLeft = state.settings.maxSearchCallsPerRun;
  const briefPath = join(dir, "search-brief.json");
  writeJson(briefPath, {
    rules: [
      "Read every direct address before you search. A direct address costs no call.",
      "A claim with existingLinkIsOfficial already links to an official page, and the run checks that page first. Do not search it. Search it only when the report says that the existing link failed.",
      "A claim with an existing link that is not official still needs a search: the run compares the two.",
      `Spend the budget. This run allows ${budgetLeft} search calls for ${items.length} claim(s).`,
      `Run at least ${MIN_QUERIES_PER_CLAIM} searches for a claim that reaches no candidate on its first query.`,
      "Pass the domains of a query to allowed_domains. Never write site: into the query text.",
      "Write your own query when the generated one returns nothing. The generated query is a start, not a limit.",
      "Widen the search before you give up: try the vendor help centre, the changelog, the release notes, and the standards body.",
      "A PDF is a valid page. The reviewer reads it.",
      "Return addresses only. Never judge or quote a result at this stage.",
      "Count every call you make and pass the count to the candidates command.",
    ],
    budget: { maxSearchCallsPerRun: budgetLeft, claims: items.length },
    output: [{ claimId: "c01", url: "https://...", rank: 0 }],
    items,
  });

  console.log(`Claims proposed: ${report.rawClaimCount}`);
  console.log(`Claims anchored: ${claims.length}`);
  console.log(`Dropped, not in the article: ${report.droppedUnanchored.length}`);
  console.log(`Dropped, prose: ${report.droppedProse.length}`);
  console.log(`Dropped, no external source can exist: ${report.droppedUnverifiable.length}`);
  if (report.droppedNoValue.length > 0) {
    console.log(`Dropped, no checkable value: ${report.droppedNoValue.length}`);
  }
  if (report.truncatedToLimit) console.log(`The claim limit of ${state.settings.maxClaims} applied.`);
  if (state.settings.brainRoot) {
    console.log(`Fact bank files: ${state.factBankFiles}`);
    console.log(`Claims that the brain proves: ${state.internalProofs.length}`);
  }
  if (state.noSourceClaimIds.length > 0) {
    console.log(`Claims in a section that needs no source: ${state.noSourceClaimIds.length}`);
    for (const id of state.noSourceClaimIds) {
      console.log(`  - ${id} in "${state.claimSections[id]}"`);
    }
  }
  console.log("");
  console.log(`Search brief: ${briefPath} (${items.length} claim(s))`);
  console.log(`Search budget: ${budgetLeft} calls. Read the rules in the brief and spend them.`);
  console.log("Next: run the search tool for each query. Pass every query's domains to");
  console.log(`\`allowed_domains\`. Write hits.json in ${dir} as`);
  console.log('  [{ "claimId": "c1", "url": "https://...", "rank": 0 }]');
  console.log(`Then run: candidates --dir ${dir} --search-calls <count>`);
}

// ---- candidates --------------------------------------------------------------

interface HitRow {
  claimId: string;
  url: string;
  rank?: number;
}

function commandCandidates(args: Args): void {
  const dir = dirOf(args);
  const state = loadState(dir);
  const policy = policyOf(state);
  const hitsPath = args.flags.get("in") ?? join(dir, "hits.json");
  const hits = existsSync(hitsPath) ? readJson<HitRow[]>(hitsPath) : [];

  const budget = new SearchBudget(state.settings.maxSearchCallsPerRun, "web-search");
  const callsUsed = Number(args.flags.get("search-calls") ?? "0");
  for (let index = 0; index < callsUsed; index += 1) budget.take();
  budget.addResults(hits.length);
  if (args.flags.get("search-degraded")) budget.markDegraded(args.flags.get("search-degraded")!);

  const provenIds = new Set(state.internalProofs.map((proof) => proof.claimId));
  const byClaim = new Map<string, SearchHit[]>();
  for (const hit of hits) {
    if (!byClaim.has(hit.claimId)) byClaim.set(hit.claimId, []);
    byClaim.get(hit.claimId)!.push({ url: hit.url, rank: hit.rank ?? 0 });
  }

  const all: Candidate[] = [];
  for (const claim of state.claims) {
    if (provenIds.has(claim.id)) continue;
    const plan = state.plans[claim.id];
    if (!plan) continue;
    const candidates = collectCandidates({
      claimId: claim.id,
      claimText: claim.text,
      claimSubject: claim.subject,
      plan,
      policy,
      articleUrl: state.articleUrl,
      searchHits: byClaim.get(claim.id) ?? [],
      maxCandidatesPerClaim: state.settings.maxCandidatesPerClaim,
    });
    all.push(...orderCandidates(candidates, policy));
  }

  // A claim that reached this step with no address and no hit was never
  // searched. That is a different result from a search that found nothing, and
  // the report must not blur the two.
  state.unsearchedClaimIds = state.claims
    .filter((claim) => !provenIds.has(claim.id))
    .filter((claim) => {
      const plan = state.plans[claim.id];
      const hits = byClaim.get(claim.id) ?? [];
      return (plan?.directUrls.length ?? 0) === 0 && hits.length === 0;
    })
    .map((claim) => claim.id);

  state.candidates = all;
  state.budget = budget.report();
  state.step = "pages";
  saveState(dir, state);

  const live = all.filter((candidate) => candidate.rejectReason === null);
  const blocked = all.length - live.length;
  console.log(`Candidates collected: ${all.length}`);
  console.log(`Blocked before download: ${blocked}`);
  for (const candidate of all.filter((item) => item.rejectReason !== null).slice(0, 10)) {
    console.log(`  - ${candidate.url} — ${candidate.rejectReason}: ${candidate.rejectDetail}`);
  }
  console.log(`Pages to download: ${live.length}`);
  if (state.unsearchedClaimIds.length > 0) {
    console.log("");
    console.log(
      `WARNING: ${state.unsearchedClaimIds.length} claim(s) received no address and no search result.`,
    );
    console.log("The report will state that they were never searched, not that they have no source.");
    for (const id of state.unsearchedClaimIds) {
      const claim = state.claims.find((item) => item.id === id);
      console.log(`  - ${id}: ${claim?.text.slice(0, 70) ?? ""}`);
    }
    console.log("Search them, then run this command again with the new hits.");
  }
  console.log("");
  console.log(`Next: pages --dir ${dir}`);
}

// ---- pages -------------------------------------------------------------------

async function commandPages(args: Args): Promise<void> {
  const dir = dirOf(args);
  const state = loadState(dir);
  const policy = policyOf(state);
  const articleDate = toDate(state.publishedAt);

  const judgeItems: {
    claimId: string;
    claimText: string;
    url: string;
    sourceType: string;
    requiredValues: string[];
    requiredTerms: string[];
    pageTitle: string;
    excerpt: string;
  }[] = [];

  for (const candidate of state.candidates) {
    if (candidate.rejectReason !== null) continue;
    const plan = state.plans[candidate.claimId];
    const claim = state.claims.find((item) => item.id === candidate.claimId);
    if (!plan || !claim) continue;

    const page = await fetchPage(candidate.url, { minPageChars: MIN_PAGE_CHARS });
    candidate.fetchStatus = page.status;
    candidate.pageTitle = page.title;
    candidate.publishedAt = page.publishedAt;
    candidate.modifiedAt = page.modifiedAt;
    candidate.isLivingDocument = policy.isLivingDocument(candidate.url, candidate.sourceType);

    if (page.status !== FetchStatus.OK) {
      candidate.rejectReason = RejectReason.FETCH_FAILED;
      candidate.rejectDetail = page.detail;
      addError(state, "fetch", candidate.url, `${page.status}: ${page.detail}`);
      continue;
    }
    writePage(dir, candidate.url, page.text);

    candidate.temporalRelation = temporalRelation(
      {
        isLivingDocument: candidate.isLivingDocument,
        publishedAt: page.publishedAt,
        modifiedAt: page.modifiedAt,
      },
      articleDate,
    );

    const rejection = preJudgeGates({
      candidate: { url: candidate.url, domain: candidate.domain, sourceType: candidate.sourceType },
      plan,
      pageText: page.text,
      policy,
      subject: claim.subject,
      claimKind: claim.kind,
      pageTitle: page.title,
    });
    if (rejection) {
      candidate.rejectReason = rejection.reason;
      candidate.rejectDetail = rejection.detail;
      continue;
    }

    if (!versionScopeOk(claim.text, page.text)) {
      candidate.rejectReason = RejectReason.VALUE_MISMATCH;
      candidate.rejectDetail = "The page states a different version of the same product.";
      continue;
    }

    judgeItems.push({
      claimId: candidate.claimId,
      claimText: claim.text,
      url: candidate.url,
      sourceType: candidate.sourceType,
      requiredValues: plan.requiredValues,
      requiredTerms: plan.requiredTerms,
      pageTitle: page.title,
      excerpt: relevantExcerpt(page.text, plan, EXCERPT_CHARS, claim.text),
    });
  }

  state.step = "verdict";
  saveState(dir, state);
  const briefPath = join(dir, "judge-brief.json");
  writeJson(briefPath, {
    rules: [
      "Answer from the excerpt only. Never answer from memory or from what you know about the product.",
      "Return supports only when the page states the claim and all four answers below pass.",
      "Read the page title and the excerpt together. High authority never makes an adjacent subject relevant.",
      "Set sameContext=false when the passage is about a different product, a different version, a different plan, or a different situation than the claim.",
      "Set coversFullClaim=false when the page proves only one branch, one number, one condition, or one exception of the claim.",
      "Set quoteSelfContained=false when the quote leans on omitted text through words such as 'this', 'above', 'these', or another unresolved reference. Widen the continuous quote when the context is in the excerpt.",
      "Set currencyStatus=current only when the page states the state of the product at the date of the article. Use historical_match for a claim that is openly about the past, not_applicable when currency cannot apply, unclear when you cannot tell, and outdated for a superseded statement.",
      "Copy one continuous quote word for word from the excerpt. Never join two passages.",
      "Leave the quote empty for insufficient.",
      "Return insufficient for a page that is close to the claim but does not state it.",
    ],
    output: [
      {
        claimId: "c01",
        url: "https://...",
        verdict: "supports",
        confidence: 0.9,
        quote: "one continuous quote copied from the excerpt",
        reasoning: "short reason",
        sameContext: true,
        coversFullClaim: true,
        quoteSelfContained: true,
        currencyStatus: "current",
      },
    ],
    items: judgeItems,
  });

  const failed = state.candidates.filter(
    (candidate) => candidate.rejectReason === RejectReason.FETCH_FAILED,
  ).length;
  const gated = state.candidates.filter(
    (candidate) =>
      candidate.rejectReason !== null && candidate.rejectReason !== RejectReason.FETCH_FAILED,
  ).length;
  console.log(`Pages downloaded: ${state.candidates.length - failed}`);
  console.log(`Pages that failed to load: ${failed}`);
  console.log(`Pages that a gate stopped before the model: ${gated}`);
  console.log(`Pages for the model to read: ${judgeItems.length}`);
  console.log("");
  console.log(`Judge brief: ${briefPath}`);
  console.log("Read the excerpt of each row. The excerpt is the page. Never use memory.");
  console.log(`Write verdicts.json in ${dir}, one row per item, in the shape of "output" in judge-brief.json`);
  console.log("(sameContext, coversFullClaim, quoteSelfContained and currencyStatus are required: a missing one rejects the page).");
  console.log(`Then run: verdict --dir ${dir}`);
}

// ---- verdict -----------------------------------------------------------------

interface VerdictRow {
  claimId: string;
  url: string;
  verdict: string;
  confidence: number;
  quote: string;
  reasoning?: string;
  sameContext?: boolean;
  coversFullClaim?: boolean;
  quoteSelfContained?: boolean;
  currencyStatus?: CurrencyStatus;
}

function commandVerdict(args: Args): void {
  const dir = dirOf(args);
  const state = loadState(dir);
  const policy = policyOf(state);
  const rows = readJson<VerdictRow[]>(args.flags.get("in") ?? join(dir, "verdicts.json"));
  const byKey = new Map(rows.map((row) => [`${row.claimId} ${row.url}`, row]));

  for (const candidate of state.candidates) {
    if (candidate.rejectReason !== null) continue;
    const row = byKey.get(`${candidate.claimId} ${candidate.url}`);
    if (!row) {
      candidate.rejectReason = RejectReason.JUDGE_ERROR;
      candidate.rejectDetail = "The model returned no answer for this page.";
      continue;
    }

    const pageText = readPage(dir, candidate.url);
    const outcome = applyVerdict({
      candidate: { url: candidate.url, domain: candidate.domain, sourceType: candidate.sourceType },
      pageText,
      plan: state.plans[candidate.claimId],
      answer: {
        verdict: row.verdict as Verdict,
        confidence: row.confidence,
        quote: row.quote,
        reasoning: row.reasoning ?? "",
        sameContext: row.sameContext,
        coversFullClaim: row.coversFullClaim,
        quoteSelfContained: row.quoteSelfContained,
        currencyStatus: row.currencyStatus,
      },
      policy,
    });
    candidate.verdict = row.verdict as Verdict;
    candidate.quote = outcome.quote;
    candidate.confidence = outcome.confidence;
    candidate.reasoning = outcome.reasoning;
    candidate.quoteCarriesClaim = outcome.quoteCarriesClaim;
    candidate.sameContext = outcome.sameContext;
    candidate.coversFullClaim = outcome.coversFullClaim;
    candidate.quoteSelfContained = outcome.quoteSelfContained;
    candidate.currencyStatus = outcome.currencyStatus;
    if (outcome.rejection) {
      candidate.rejectReason = outcome.rejection.reason;
      candidate.rejectDetail = outcome.rejection.detail;
      continue;
    }
    candidate.accepted = true;
    candidate.score = scoreCandidate(candidate);
  }

  // One claim keeps one source. `selectBest` states the cause on every other
  // candidate, so the report never drops a page without a reason.
  const results = state.claims.map((claim) => {
    const mine = state.candidates.filter((candidate) => candidate.claimId === claim.id);
    return selectBest(
      { claim, plan: state.plans[claim.id]!, accepted: null, rejected: [] },
      mine,
      policy,
    );
  });
  const removed = applyTotalCap(results, state.settings.maxSourcesTotal);

  state.step = "report";
  saveState(dir, state);

  const accepted = state.candidates.filter((candidate) => candidate.accepted).length;
  console.log(`Sources accepted: ${accepted}`);
  console.log(`Removed by the total cap: ${removed}`);
  console.log(`Claims without a source: ${state.claims.length - accepted}`);
  console.log("");
  console.log(`Next: report --dir ${dir}`);
}

// ---- report ------------------------------------------------------------------

function commandReport(args: Args): void {
  const dir = dirOf(args);
  const state = loadState(dir);
  const path = args.flags.get("out") ?? join(dir, "source-review.md");
  writeFileSync(path, markdownReport(state), "utf-8");
  const { verdict, reasons } = reviewVerdict(state);
  state.step = "done";
  saveState(dir, state);

  console.log(`Report: ${path}`);
  console.log(`Verdict: ${verdict}`);
  for (const reason of reasons) console.log(`  - ${reason}`);
}

// ---- help --------------------------------------------------------------------

const HELP = `Claim Source Reviewer

  start <url|path> --dir <folder> [--brain <path>] [--published-at YYYY-MM-DD]
                                  [--strict] [--packs core,software,web-stack]
                                  [--max-claims N] [--target-source-count N]
                                  [--max-sources-total N] [--max-search-calls N]
  claims     --dir <folder> [--in claims.json]
  candidates --dir <folder> [--in hits.json] [--search-calls N] [--search-degraded "<cause>"]
  pages      --dir <folder>
  verdict    --dir <folder> [--in verdicts.json]
  report     --dir <folder> [--out source-review.md]

Read SKILL.md in the source-review skill folder for the steps between the commands.
`;

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const command = args.positional[0] ?? "help";
  switch (command) {
    case "start":
      await commandStart(args);
      break;
    case "claims":
      commandClaims(args);
      break;
    case "candidates":
      commandCandidates(args);
      break;
    case "pages":
      await commandPages(args);
      break;
    case "verdict":
      commandVerdict(args);
      break;
    case "report":
      commandReport(args);
      break;
    default:
      console.log(HELP);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
