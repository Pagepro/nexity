/**
 * How to put a source into the article.
 *
 * A verified source is only half the work. The editor still has to decide
 * whether the address belongs inside the sentence, under it, or whether the
 * sentence has to change first. That decision follows from facts the run
 * already holds, so this module answers it the same way every time instead of
 * leaving it to the mood of the reader.
 *
 * The rules, in the order they apply:
 *
 * 1. An official page denies the claim. Fix the sentence before any link.
 * 2. The claim carries a checkable value. The reader wants to know where the
 *    number comes from, so the address goes under the sentence with a name.
 * 3. The sentence already names the owner of the source. The link goes on that
 *    phrase, because that is where a reader looks for the authority.
 * 4. Nothing else applies. A plain inline link on the statement.
 *
 * A high confidence source for a claim that carries a value also earns the
 * quote itself. That is the only form that proves the point without a click,
 * and an AI answer that lifts the passage carries the attribution with it.
 */

import { hostOf, sameHost } from "./links.js";
import { SourceType } from "./models.js";
import { extractValues } from "./textops.js";

export const Placement = {
  /** A link inside the sentence, on the phrase that names the source. */
  INLINE: "inline",
  /** A named source line under the sentence. */
  SOURCE_LINE: "source_line",
  /** A source line and the quote itself, for a load bearing claim. */
  QUOTE_BLOCK: "quote_block",
  /** The sentence has to change before it carries any link. */
  REWRITE_FIRST: "rewrite_first",
  /** The sentence already links to this source. Nothing to do. */
  ALREADY_LINKED: "already_linked",
} as const;
export type Placement = (typeof Placement)[keyof typeof Placement];

/** Host labels that name a section of a site, never its owner. */
const GENERIC_LABELS = new Set([
  "www", "docs", "doc", "developers", "developer", "support", "help", "blog",
  "learn", "api", "cloud", "web", "search", "en", "m",
  // Second level labels of a country pair, so `example.co.uk` gives `example`.
  "co", "com", "org", "net", "gov", "ac",
]);

/** The confidence at which a source with a value earns its quote. */
export const QUOTE_BLOCK_CONFIDENCE = 0.9;

export interface PlacementAdvice {
  placement: Placement;
  /** The phrase to carry the link, or an empty string. */
  anchor: string;
  /** The name to print next to the address. */
  sourceName: string;
  /** One sentence that states why. */
  note: string;
}

/** Return the brand of a host, without the section label and the suffix. */
export function brandOf(domain: string): string {
  const labels = domain.toLowerCase().split(".").filter(Boolean);
  if (labels.length === 0) return "";
  // Drop the top level label, then walk back over the labels that name a
  // section of the site rather than its owner.
  const withoutTld = labels.slice(0, Math.max(1, labels.length - 1));
  for (let index = withoutTld.length - 1; index >= 0; index -= 1) {
    const label = withoutTld[index]!;
    if (!GENERIC_LABELS.has(label)) return label;
  }
  return withoutTld.at(-1) ?? "";
}

/**
 * Return the phrase of the claim that names the source, or an empty string.
 *
 * The phrase starts at the brand and runs to the verb that follows it, so the
 * link sits on "Google officially recommends" rather than on "Google" alone.
 */
export function anchorPhrase(claimText: string, brand: string): string {
  if (!brand) return "";
  const words = claimText.split(/\s+/);
  const at = words.findIndex((word) =>
    word.toLowerCase().replace(/[^a-z0-9]/g, "").includes(brand),
  );
  if (at < 0) return "";
  return words
    .slice(at, at + 3)
    .join(" ")
    .replace(/[,.;:]$/, "");
}

export interface PlacementInput {
  claimText: string;
  /**
   * The reduced list that the search path uses. It is not the answer to
   * "does this sentence carry a number": `requiredValuesOf` drops a bare
   * integer on purpose, because a long web page holds every digit by
   * accident. The claim "at least 180 days" arrived here with an empty list.
   * The advice reads the sentence itself instead.
   */
  requiredValues: string[];
  sourceType: SourceType;
  domain: string;
  pageTitle: string;
  confidence: number;
  /** True when an official page denies the claim. */
  denied: boolean;
  /**
   * The addresses that the sentence already links to.
   *
   * A review that proposes a link for a sentence that carries one already
   * sends an editor to do work that is done. Two live migration articles
   * linked the very page that the run proposed.
   */
  existingLinks?: string[];
}

function basePlacement(input: PlacementInput): PlacementAdvice {
  const brand = brandOf(input.domain);
  const anchor = anchorPhrase(input.claimText, brand);
  const sourceName = input.pageTitle
    ? `${input.pageTitle.split("|")[0]!.trim()} (${input.domain})`
    : input.domain;

  if (input.denied) {
    return {
      placement: Placement.REWRITE_FIRST,
      anchor: "",
      sourceName,
      note:
        "An official page denies this sentence. Correct or drop it first. " +
        "A link under a wrong sentence makes the error look checked.",
    };
  }

  // Read the sentence, not the search list. A sentence that states 180 days
  // carries a number even when the search path chose not to hunt for it.
  const carriesValue =
    input.requiredValues.length > 0 || extractValues(input.claimText).length > 0;

  if (carriesValue && input.confidence >= QUOTE_BLOCK_CONFIDENCE) {
    return {
      placement: Placement.QUOTE_BLOCK,
      anchor,
      sourceName,
      note:
        "The sentence carries a number and the source states it plainly. " +
        "Print the quote under the sentence with the source name, so a reader " +
        "and an answer engine both see the proof without a click.",
    };
  }

  if (carriesValue) {
    return {
      placement: Placement.SOURCE_LINE,
      anchor,
      sourceName,
      note:
        "The sentence carries a number. A reader checking it needs to know " +
        "which page it came from, so name the source under the sentence " +
        "instead of hiding the address inside the text.",
    };
  }

  if (anchor) {
    return {
      placement: Placement.INLINE,
      anchor,
      sourceName,
      note:
        `The sentence already names the source. Put the link on "${anchor}", ` +
        "which is where a reader looks for the authority.",
    };
  }

  return {
    placement: Placement.INLINE,
    anchor: "",
    sourceName,
    note:
      "A plain inline link on the statement. The sentence names no source and " +
      "carries no number, so it needs no line of its own.",
  };
}

/** Return true when the source type is a fallback rather than first-party. */
export function isWeakForCitation(sourceType: SourceType): boolean {
  return sourceType === SourceType.GENERAL_WEB || sourceType === SourceType.USER_GENERATED;
}

/**
 * Return the advice for one claim and its source.
 *
 * The links that the sentence already carries decide first. A sentence that
 * links to the source needs nothing, and a sentence that links elsewhere needs
 * a comparison rather than a second link.
 */
export function placementFor(input: PlacementInput): PlacementAdvice {
  const advice = basePlacement(input);
  const existing = (input.existingLinks ?? []).filter(Boolean);
  if (existing.length === 0) return advice;

  const target = `https://${input.domain}`;
  const same = existing.filter((href) => sameHost(href, target));
  if (same.length > 0 && !input.denied) {
    return {
      ...advice,
      placement: Placement.ALREADY_LINKED,
      note:
        `The sentence already links to this source (${same[0]}). ` +
        "Leave it as it is. This run confirms the link rather than asking for a second one.",
    };
  }

  const others = [...new Set(existing.map((href) => hostOf(href)).filter(Boolean))];
  return {
    ...advice,
    note:
      `${advice.note} The sentence already links to ${others.join(", ")}. ` +
      "Compare the two before you add a second link.",
  };
}
