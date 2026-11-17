/**
 * Text and URL helpers.
 *
 * This module is a port of `src/claim_source_reviewer/textops.py`. It holds no
 * network code and no policy data.
 *
 * Two functions here carry the anti-hallucination gates:
 *
 * - `findAnchor` locates a claim in the article text. A claim with no location
 *   is an invented claim, and the extractor drops it.
 * - `quoteIsInPage` checks that a quote comes from the page text.
 *
 * `docs/PORT-CONTRACT.md` states what these functions must reproduce.
 */

import { partialRatio, partialRatioAlignment } from "./fuzzy.js";

export const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_src",
  "source",
]);

export const VERSION_PATTERN = /\bv?\d+(?:\.\d+){1,3}\b/gi;
export const PERCENT_PATTERN = /\b\d{1,3}(?:[.,]\d+)?\s?%/g;
export const NUMBER_PATTERN = /\b\d[\d.,]{0,15}\b/g;
export const YEAR_PATTERN = /\b(?:19|20)\d{2}\b/g;
export const ISO_DATE_PATTERN = /\b(?:19|20)\d{2}-\d{2}-\d{2}\b/g;
export const STANDARD_PATTERN =
  /\b(?:RFC\s?\d{3,5}|ISO[/ ]?\d{4,5}|CVE-\d{4}-\d{4,7}|ECMA-\d{3})\b/gi;

const WHITESPACE = /\s+/g;
const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-Z0-9"'([])/;
const PARAGRAPH_SPLIT = /\n\s*\n+/;

/** Return the text with single spaces and no leading or trailing space. */
export function normalizeWs(text: string): string {
  return text.replace(WHITESPACE, " ").trim();
}

/**
 * Return a comparable form of the text.
 *
 * The function lowers the case, removes accents, and collapses white space.
 * It mirrors `textops.fold`.
 */
export function fold(text: string): string {
  const withoutMarks = text.normalize("NFKD").replace(/\p{M}/gu, "");
  return normalizeWs(withoutMarks.toLowerCase());
}

/**
 * Split a text into sentences.
 *
 * The function joins the lines of one paragraph before it splits. A hard line
 * break inside a sentence must not create two sentences.
 */
export function splitSentences(text: string): string[] {
  const parts: string[] = [];
  for (const block of text.split(PARAGRAPH_SPLIT)) {
    const joined = normalizeWs(block);
    if (!joined) continue;
    for (const piece of joined.split(SENTENCE_SPLIT)) {
      const trimmed = piece.trim();
      if (trimmed) parts.push(trimmed);
    }
  }
  return parts;
}

/**
 * Return a stable form of a URL for deduplication.
 *
 * The function lowers the scheme and the host, removes the fragment, removes
 * tracking parameters, and removes a trailing slash.
 */
export function canonicalUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    try {
      parsed = new URL(`https://${trimmed}`);
    } catch {
      return trimmed;
    }
  }

  const scheme = (parsed.protocol.replace(":", "") || "https").toLowerCase();
  let host = parsed.hostname.toLowerCase();
  if (host.startsWith("www.")) host = host.slice(4);

  const port = parsed.port;
  const keepPort =
    port && !((scheme === "http" && port === "80") || (scheme === "https" && port === "443"));
  const netloc = keepPort ? `${host}:${port}` : host;

  // Keep the parameter order of the address, like `urlencode(parse_qsl(...))`.
  const kept: string[] = [];
  for (const [key, value] of parsed.searchParams.entries()) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) continue;
    kept.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  const query = kept.join("&");

  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  return `${scheme}://${netloc}${path}${query ? `?${query}` : ""}`;
}

// ---- claim anchoring ---------------------------------------------------------

export type AnchorMethod = "exact" | "normalized" | "fuzzy" | "not_found";

export interface TextSpan {
  start: number;
  end: number;
}

export interface AnchorResult {
  method: AnchorMethod;
  span: TextSpan | null;
  score: number;
}

/** Return the folded text and a map from folded index to source index. */
function foldWithMap(text: string): { folded: string; indexMap: number[] } {
  const out: string[] = [];
  const indexMap: number[] = [];
  let previousSpace = true;

  for (let position = 0; position < text.length; position += 1) {
    const char = text[position]!;
    const cleaned = char.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
    if (!cleaned) continue;

    if (/^\s+$/.test(cleaned)) {
      if (previousSpace) continue;
      out.push(" ");
      indexMap.push(position);
      previousSpace = true;
      continue;
    }
    for (const piece of cleaned) {
      out.push(piece);
      indexMap.push(position);
    }
    previousSpace = false;
  }

  let start = 0;
  while (start < out.length && out[start] === " ") start += 1;
  let end = out.length;
  while (end > start && out[end - 1] === " ") end -= 1;

  return { folded: out.slice(start, end).join(""), indexMap: indexMap.slice(start, end) };
}

/**
 * Locate a claim inside the article text.
 *
 * A claim with the method `not_found` did not come from the article. The caller
 * must drop that claim.
 */
export function findAnchor(
  articleText: string,
  claimText: string,
  fuzzyThreshold = 92,
): AnchorResult {
  const claim = claimText.trim();
  if (!claim) return { method: "not_found", span: null, score: 0 };

  const start = articleText.indexOf(claim);
  if (start >= 0) {
    return {
      method: "exact",
      span: { start, end: start + claim.length },
      score: 100,
    };
  }

  const { folded: foldedArticle, indexMap } = foldWithMap(articleText);
  const foldedClaim = fold(claim);
  if (!foldedClaim) return { method: "not_found", span: null, score: 0 };

  const position = foldedArticle.indexOf(foldedClaim);
  if (position >= 0) {
    const end = position + foldedClaim.length - 1;
    return {
      method: "normalized",
      span: { start: indexMap[position]!, end: indexMap[end]! + 1 },
      score: 100,
    };
  }

  const alignment = partialRatioAlignment(foldedClaim, foldedArticle);
  if (!alignment || alignment.score < fuzzyThreshold) {
    return { method: "not_found", span: null, score: alignment?.score ?? 0 };
  }
  const destStart = Math.min(alignment.destStart, indexMap.length - 1);
  const destEnd = Math.min(Math.max(alignment.destEnd - 1, destStart), indexMap.length - 1);
  return {
    method: "fuzzy",
    span: { start: indexMap[destStart]!, end: indexMap[destEnd]! + 1 },
    score: alignment.score,
  };
}

// ---- value checks ------------------------------------------------------------

function matchAll(pattern: RegExp, text: string): string[] {
  const copy = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  return [...text.matchAll(copy)].map((match) => match[0]);
}

/**
 * Return the checkable values in a text.
 *
 * A checkable value is a version, a percentage, a standard identifier, a date,
 * or a number.
 */
export function extractValues(text: string): string[] {
  const values: string[] = [];
  for (const pattern of [
    STANDARD_PATTERN,
    VERSION_PATTERN,
    PERCENT_PATTERN,
    ISO_DATE_PATTERN,
    YEAR_PATTERN,
    NUMBER_PATTERN,
  ]) {
    for (const found of matchAll(pattern, text)) {
      const value = found.trim();
      if (value && !values.includes(value)) values.push(value);
    }
  }
  return values;
}

/** Return comparable forms of one value. */
function valueVariants(value: string): string[] {
  const base = value.trim().toLowerCase().replaceAll(" ", "");
  const variants = new Set<string>([base]);
  if (base.startsWith("v") && /\d/.test(base.charAt(1))) {
    variants.add(base.slice(1));
  } else {
    variants.add(`v${base}`);
  }
  if (base.endsWith("%")) variants.add(base.slice(0, -1));
  variants.add(base.replaceAll(",", ""));
  variants.add(base.replaceAll(",", "."));
  return [...variants].filter(Boolean);
}

/** Report whether a page text states one value. */
export function valuePresent(value: string, pageText: string): boolean {
  const foldedPage = fold(pageText).replaceAll(" %", "%");
  const compactPage = foldedPage.replaceAll(" ", "");
  return valueVariants(value).some((variant) => compactPage.includes(variant));
}

/** Return the required values that the page text does not state. */
export function missingValues(required: string[], pageText: string): string[] {
  return required.filter((value) => !valuePresent(value, pageText));
}

/** Return the required terms that the page text does not state. */
export function missingTerms(required: string[], pageText: string): string[] {
  const foldedPage = fold(pageText);
  return required.filter((term) => !foldedPage.includes(fold(term)));
}

export const MIN_QUOTE_FRAGMENT_CHARS = 15;

/**
 * Report whether a quote comes from the page text.
 *
 * The check blocks a quote that the model invented. It runs in two steps:
 *
 * 1. It compares the whole quote against the page.
 * 2. If step 1 fails, it compares each sentence of the quote against the page.
 *    Every sentence must match.
 *
 * Step 2 accepts a quote that joins two passages of the page. A model often
 * joins a heading and a sentence. Each part is still the words of the page, so
 * the quote is evidence. Step 2 rejects the quote when one part is absent, so
 * an invented sentence still fails.
 */
export function quoteIsInPage(quote: string, pageText: string, threshold = 90): boolean {
  if (!quote.trim()) return false;
  const foldedPage = fold(pageText);
  const foldedQuote = fold(quote);

  if (foldedPage.includes(foldedQuote)) return true;
  if (partialRatio(foldedQuote, foldedPage) >= threshold) return true;

  const fragments = splitSentences(quote).filter(
    (fragment) => fragment.trim().length >= MIN_QUOTE_FRAGMENT_CHARS,
  );
  if (fragments.length < 2) return false;

  return fragments.every((fragment) => {
    const folded = fold(fragment);
    return foldedPage.includes(folded) || partialRatio(folded, foldedPage) >= threshold;
  });
}
