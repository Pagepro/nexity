/**
 * The report of one article review.
 *
 * This module is a port of `markdown_report` in
 * `src/claim_source_reviewer/dataio/exports.py`. It adds the verdict line that
 * an article pipeline expects, so the human gate reads one verdict
 * from the post-processing layer and one from this layer.
 *
 * The report states what the run did **and** what it could not do. A claim
 * without a source is a result, not a gap in the report.
 */

import { Verdict, type Candidate, type ClaimResult } from "./models.js";
import { placementFor, isWeakForCitation } from "./placement.js";
import { meetsTarget } from "./rank.js";
import type { RunState } from "./run.js";

/** The verdict of the review. An article pipeline uses these three words. */
export const ReviewVerdict = {
  PASS: "PASS",
  PASS_WITH_WARNINGS: "PASS_WITH_WARNINGS",
  BLOCKED: "BLOCKED",
} as const;
export type ReviewVerdict = (typeof ReviewVerdict)[keyof typeof ReviewVerdict];

/** Return the candidate that denies the claim, or `null`. */
export function contradictionOf(result: ClaimResult): Candidate | null {
  for (const candidate of result.rejected) {
    if (candidate.verdict === Verdict.CONTRADICTS) return candidate;
  }
  return null;
}

/** Build the per-claim view from the flat candidate list. */
export function resultsOf(state: RunState): ClaimResult[] {
  return state.claims.map((claim) => {
    const mine = state.candidates.filter((candidate) => candidate.claimId === claim.id);
    const accepted = mine.find((candidate) => candidate.accepted) ?? null;
    return {
      claim,
      plan: state.plans[claim.id] ?? {
        claimId: claim.id,
        requiredTerms: [],
        requiredValues: [],
        preferredDomains: [],
        directUrls: [],
        queries: [],
      },
      accepted,
      rejected: mine.filter((candidate) => candidate !== accepted),
    };
  });
}

/**
 * Return the ids of the claims that the brain proves.
 *
 * Such a claim has no external source and needs none. It must never count as a
 * claim without a source, because that reads as a gap in the article.
 */
export function provenByBrain(state: RunState): Set<string> {
  return new Set(state.internalProofs.map((proof) => proof.claimId));
}

/**
 * Return the ids of the claims that need no external source.
 *
 * Two causes: the brain proves the claim, or the claim sits in a section that
 * the policy pack says carries no citation, such as an FAQ block. Neither is a
 * gap in the article, so neither counts as a claim without a source.
 */
export function needsNoExternalSource(state: RunState): Set<string> {
  return new Set([...provenByBrain(state), ...(state.noSourceClaimIds ?? [])]);
}

export interface VerdictReport {
  verdict: ReviewVerdict;
  reasons: string[];
}

/**
 * Return the verdict of the review.
 *
 * The rule follows the house principle: quality over completeness. A missing
 * source is a warning, never a block. A denied claim is a block, because the
 * article states a value that an official page denies.
 */
export function reviewVerdict(state: RunState): VerdictReport {
  const results = resultsOf(state);
  const reasons: string[] = [];
  let blocked = false;

  const denied = results.filter((result) => contradictionOf(result) !== null);
  if (denied.length > 0) {
    blocked = true;
    reasons.push(
      `${denied.length} claim(s) that an official page denies. Correct the article or drop the claim.`,
    );
  }

  const blockedProofs = state.internalProofs.filter((proof) => !proof.citable);
  if (blockedProofs.length > 0) {
    blocked = true;
    reasons.push(
      `${blockedProofs.length} claim(s) rest on a proof line that is marked INTERNAL or [VERIFY].`,
    );
  }

  const proven = needsNoExternalSource(state);
  const missing = results.filter(
    (result) => !result.accepted && !proven.has(result.claim.id),
  ).length;
  if (missing > 0) {
    reasons.push(`${missing} claim(s) reached no source. The report names each one.`);
  }
  if (state.extraction && state.extraction.droppedUnanchored.length > 0) {
    reasons.push(
      `${state.extraction.droppedUnanchored.length} proposed claim(s) are not in the article text. The run dropped them.`,
    );
  }
  const unsearched = (state.unsearchedClaimIds ?? []).length;
  if (unsearched > 0) {
    reasons.push(
      `${unsearched} claim(s) were never searched. That is not the same as a claim with no source, ` +
        "and the report names each one.",
    );
  }
  if (state.budget?.degraded) {
    reasons.push(`The search ran degraded: ${state.budget.degradedReason}`);
  }
  if (state.budget?.exhausted) {
    reasons.push("The search budget ran out. Some claims received fewer candidates.");
  }
  if (state.errors.length > 0) {
    reasons.push(`${state.errors.length} page(s) failed to load. The report names each one.`);
  }
  if (!meetsTarget(results, state.settings.targetSourceCount)) {
    reasons.push(
      `The run found fewer sources than the goal of ${state.settings.targetSourceCount}. The goal never removes a source.`,
    );
  }

  if (blocked) return { verdict: ReviewVerdict.BLOCKED, reasons };
  if (reasons.length > 0) return { verdict: ReviewVerdict.PASS_WITH_WARNINGS, reasons };
  return { verdict: ReviewVerdict.PASS, reasons: ["Every claim reached an authoritative source."] };
}

function section(lines: string[], heading: string): void {
  lines.push(heading, "");
}

/** Return the links that the sentence of a claim already carries. */
function linksOf(state: RunState, claimId: string): { href: string; text: string }[] {
  return state.claimLinks?.[claimId] ?? [];
}

/**
 * The line for a run that checked no claim. An article with only instructions
 * or only a list reached the report with "Every claim received a source", which
 * reads as a result when nothing was checked.
 */
export const NO_CLAIMS_CHECKED =
  "The run checked no claim: no sentence of the article states a fact that needs a source.";

/** Return the report of one run for a person to read. */
export function markdownReport(state: RunState): string {
  const results = resultsOf(state);
  const proven = needsNoExternalSource(state);
  const inNoSourceSection = new Set(state.noSourceClaimIds ?? []);
  const found = results.filter((result) => result.accepted !== null);
  const missing = results.filter(
    (result) => result.accepted === null && !proven.has(result.claim.id),
  );
  const { verdict, reasons } = reviewVerdict(state);
  const lines: string[] = [];

  lines.push(`# Source review: ${state.title || state.sourceRef}`, "");
  lines.push(`**Verdict: ${verdict}**`, "");
  for (const reason of reasons) lines.push(`- ${reason}`);
  lines.push("");

  lines.push(`- Article: ${state.sourceRef}`);
  lines.push(`- Run id: ${state.runId}`);
  if (state.publishedAt) lines.push(`- Article date: ${state.publishedAt}`);
  lines.push(`- Claims checked: ${results.length}`);
  lines.push(`- Claims with a source: ${found.length}`);
  lines.push(`- Claims without a source: ${missing.length}`);
  if (state.settings.brainRoot) {
    lines.push(`- Claims proved by the brain: ${state.internalProofs.length}`);
  }
  lines.push(`- Claims that need no external source: ${proven.size}`);
  if (inNoSourceSection.size > 0) {
    lines.push(`- Claims in a section that carries no citation: ${inNoSourceSection.size}`);
  }
  const bodyResults = results.filter((result) => !inNoSourceSection.has(result.claim.id));
  const bodyFound = bodyResults.filter((result) => result.accepted !== null).length;
  lines.push(`- Claims in the body: ${bodyResults.length}, of which ${bodyFound} reached a source`);
  const linkedClaims = results.filter((result) => linksOf(state, result.claim.id).length > 0);
  if (linkedClaims.length > 0) {
    lines.push(`- Claims that already carry a link: ${linkedClaims.length}`);
  }
  lines.push(`- Goal for the source count: ${state.settings.targetSourceCount}`);
  lines.push(`- Goal reached: ${meetsTarget(results, state.settings.targetSourceCount) ? "yes" : "no"}`);
  if (state.budget) {
    lines.push(
      `- Search budget: ${state.budget.searchCallsUsed} of ${state.budget.maxSearchCallsPerRun} calls used`,
    );
    if (state.budget.degraded) lines.push(`- Search degraded: ${state.budget.degradedReason}`);
  }
  lines.push(`- Fact bank files read: ${state.factBankFiles}`);
  lines.push("");

  section(lines, "## Claims with a source");
  if (results.length === 0) lines.push(NO_CLAIMS_CHECKED, "");
  else if (found.length === 0) lines.push("No claim reached the quality threshold.", "");
  for (const result of found) {
    const source = result.accepted!;
    lines.push(`### ${result.claim.id}. ${result.claim.text}`, "");
    lines.push(`- Source: <${source.url}>`);
    lines.push(`- Source type: ${source.sourceType} (weight ${source.tierWeight})`);
    lines.push(`- Confidence: ${source.confidence.toFixed(2)} | Rank score: ${source.score}`);
    lines.push(`- Quote: "${source.quote}"`);
    if (source.reasoning) lines.push(`- Reason: ${source.reasoning}`);
    if (source.quoteCarriesClaim === false) {
      lines.push(
        "- Warning: the quote names none of the terms the claim asks for. " +
          "Read it before you cite this source.",
      );
    }
    if (source.temporalRelation) lines.push(`- Age check: ${source.temporalRelation}`);
    if (source.currencyStatus) lines.push(`- Currency: ${source.currencyStatus}`);

    // How to put the source into the article. The rule is the same every run,
    // so two editors reading two reports place a source the same way.
    const already = linksOf(state, result.claim.id);
    for (const link of already) {
      lines.push(`- Already in the article: <${link.href}> on "${link.text}"`);
    }
    const advice = placementFor({
      claimText: result.claim.text,
      requiredValues: result.plan.requiredValues,
      sourceType: source.sourceType,
      domain: source.domain,
      pageTitle: source.pageTitle,
      confidence: source.confidence,
      denied: false,
      existingLinks: already.map((link) => link.href),
    });
    lines.push(`- **Placement: ${advice.placement}**`);
    if (advice.anchor) lines.push(`  - Anchor text: "${advice.anchor}"`);
    lines.push(`  - Source name: ${advice.sourceName}`);
    lines.push(`  - Why: ${advice.note}`);
    if (isWeakForCitation(source.sourceType)) {
      lines.push("  - Caution: this is a fallback source. Name it in the text, never only in a link.");
    }
    lines.push("");
  }

  const denied = results
    .map((result) => [result, contradictionOf(result)] as const)
    .filter((pair): pair is readonly [ClaimResult, Candidate] => pair[1] !== null);
  if (denied.length > 0) {
    section(lines, "## Claims that an official page denies");
    lines.push(
      "Read these first. The article states a value that a source denies.",
      "",
    );
    for (const [result, candidate] of denied) {
      lines.push(`### ${result.claim.id}. ${result.claim.text}`, "");
      lines.push(`- Denied by: <${candidate.url}>`);
      lines.push(`- Source type: ${candidate.sourceType}`);
      if (candidate.publishedAt) {
        lines.push(`- Source date: ${String(candidate.publishedAt).slice(0, 10)}`);
      }
      if (candidate.temporalRelation) lines.push(`- Age check: ${candidate.temporalRelation}`);
      // The quote is the evidence. A person who must change an article needs to
      // read the sentence that denies the claim, not only the reasoning.
      if (candidate.quote) lines.push(`- Quote: "${candidate.quote}"`);
      lines.push(`- Reason: ${candidate.reasoning || candidate.rejectDetail}`);
      const denied = placementFor({
        claimText: result.claim.text,
        requiredValues: result.plan.requiredValues,
        sourceType: candidate.sourceType,
        domain: candidate.domain,
        pageTitle: candidate.pageTitle,
        confidence: candidate.confidence,
        denied: true,
      });
      lines.push(`- **Placement: ${denied.placement}**`);
      lines.push(`  - Why: ${denied.note}`);
      lines.push("");
    }
  }

  if (state.internalProofs.length > 0) {
    section(lines, "## Claims that the brain proves");
    lines.push(
      "No external page can prove the company's own result. The proof is its case file.",
      "",
    );
    for (const proof of state.internalProofs) {
      const claim = state.claims.find((item) => item.id === proof.claimId);
      lines.push(`### ${proof.claimId}. ${claim?.text ?? ""}`, "");
      lines.push(`- Proof file: \`${proof.file}\` line ${proof.line}, section "${proof.section}"`);
      lines.push(`- Proof line: ${proof.text}`);
      lines.push(`- Citable: ${proof.citable ? "yes" : `no. ${proof.blockReason}`}`);
      lines.push("");
    }
  }

  if (inNoSourceSection.size > 0) {
    section(lines, "## Claims in a section that carries no citation");
    lines.push(
      "The house style gives these sections no citation. The run checked the claims " +
        "and reports them here. A missing source below is not a gap in the article.",
      "",
    );
    for (const result of results) {
      if (!inNoSourceSection.has(result.claim.id)) continue;
      const where = state.claimSections?.[result.claim.id] ?? "";
      lines.push(`### ${result.claim.id}. ${result.claim.text}`, "");
      lines.push(`- Section: "${where}"`);
      if (result.accepted) {
        lines.push(`- Source found anyway: <${result.accepted.url}>`);
        lines.push(`- Quote: "${result.accepted.quote}"`);
      } else {
        lines.push("- No source. The section needs none.");
      }
      lines.push("");
    }
  }

  section(lines, "## Claims without a source");
  if (results.length === 0) lines.push(NO_CLAIMS_CHECKED, "");
  else if (missing.length === 0) lines.push("Every claim received a source.", "");
  const neverSearched = new Set(state.unsearchedClaimIds ?? []);
  for (const result of missing) {
    lines.push(`### ${result.claim.id}. ${result.claim.text}`, "");
    for (const link of linksOf(state, result.claim.id)) {
      lines.push(
        `- **The sentence already links to <${link.href}>** on "${link.text}". ` +
          "The run checked that page first, and it did not pass: the line for it below " +
          "states why. Fix or replace the link rather than adding a second one.",
      );
    }
    if (neverSearched.has(result.claim.id)) {
      lines.push(
        "- **This claim was never searched.** No address and no search result reached the run, " +
          "so the absence of a source here is an absence of work, not a finding. Search it before " +
          "you act on this line.",
      );
    }
    if (result.rejected.length === 0 && !neverSearched.has(result.claim.id)) {
      lines.push("- No candidate page was found.");
    }
    for (const candidate of result.rejected.slice(0, 5)) {
      const reason = candidate.rejectReason ?? "not_selected";
      lines.push(`- ${candidate.url} — ${reason}: ${candidate.rejectDetail}`);
    }
    lines.push("");
  }

  if (state.errors.length > 0) {
    section(lines, "## Pages that failed to load");
    for (const error of state.errors) {
      lines.push(`- [${error.stage}] ${error.target}: ${error.message}`);
    }
    lines.push("");
  }

  const report = state.extraction;
  if (report) {
    const dropped: [string[], string, string][] = [
      [
        report.droppedUnanchored,
        "## Dropped claims: not in the article",
        "The run dropped these claims. They are not in the article text.",
      ],
      [
        report.droppedProse,
        "## Skipped sentences: prose, not a fact",
        "These sentences state what is possible, or give an evaluation. No official page can confirm or deny them.",
      ],
      [
        report.droppedNoValue,
        "## Skipped sentences: no checkable value (strict mode)",
        "These sentences state no version, number, percentage, date, or standard.",
      ],
      [
        report.droppedUnverifiable,
        "## Dropped claims: no external source can exist",
        "These sentences state the result of your own project or your own client. Add the proof yourself.",
      ],
    ];
    for (const [items, heading, note] of dropped) {
      if (items.length === 0) continue;
      section(lines, heading);
      lines.push(note, "");
      for (const text of items) lines.push(`- ${text}`);
      lines.push("");
    }
    if (report.truncatedToLimit) {
      section(lines, "## The claim limit stopped the run");
      lines.push(
        `The run read the first ${state.settings.maxClaims} claims. Raise \`maxClaims\` to check the rest.`,
        "",
      );
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
