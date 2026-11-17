/**
 * The links that the article already carries.
 *
 * A review that proposes a source for a sentence that already links to one
 * wastes the editor's time, and the editor cannot tell the two cases apart from
 * the report. A live run on two migration articles proposed sources for
 * sentences that already carried the very same link.
 *
 * This module reads the anchors of the article and maps each one to an offset
 * in the extracted text, the same way `sections.ts` maps a heading. A claim
 * then states the links inside its own sentence.
 *
 * The module never changes the extracted text, so every gate reads what it read
 * before.
 */

import { mainContentRoot } from "./fetch.js";
import { normalizeWs } from "./textops.js";

/** The shortest anchor text that the reader keeps. */
const MIN_ANCHOR_CHARS = 2;

/** One link of the article, with its place in the extracted text. */
export interface ArticleLink {
  href: string;
  /** The words that carry the link. */
  text: string;
  /** Offset of the anchor text in the extracted text. */
  start: number;
}

/** Return the host of an address, or an empty string. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/** Report whether a character belongs to a word. */
function isWordChar(char: string | undefined): boolean {
  return char !== undefined && /[\p{L}\p{N}]/u.test(char);
}

/** An anchor at least this long never matches inside another word by accident. */
const WHOLE_WORD_CHECK_BELOW = 25;

/**
 * Return the offset of a phrase that stands as whole words, or -1.
 *
 * A plain search put the anchor "Expo" inside the word "Export", so a short
 * anchor must stand as whole words. A long anchor skips the check: the
 * extractor joins two blocks with no space, so a sentence-long anchor that ends
 * a paragraph touches the first letter of the next one, and the check refused
 * two real source links of a live article.
 */
function findWhole(text: string, phrase: string, from: number): number {
  const checkStart = phrase.length < WHOLE_WORD_CHECK_BELOW && isWordChar(phrase[0]);
  const checkEnd = phrase.length < WHOLE_WORD_CHECK_BELOW && isWordChar(phrase.at(-1));
  let at = text.indexOf(phrase, from);
  while (at >= 0) {
    const startOk = !checkStart || !isWordChar(text[at - 1]);
    const endOk = !checkEnd || !isWordChar(text[at + phrase.length]);
    if (startOk && endOk) return at;
    at = text.indexOf(phrase, at + 1);
  }
  return -1;
}

/**
 * Return the links of the article, in document order.
 *
 * The anchors come from the same container as the article text, so a menu, a
 * tag list or a related-post block never reaches the answer. The offset comes
 * from a search in the extracted text, which starts after the previous link.
 */
export function readLinks(html: string, text: string): ArticleLink[] {
  const root = mainContentRoot(html);
  if (!root) return [];

  const links: ArticleLink[] = [];
  let cursor = 0;
  for (const element of [...root.querySelectorAll("a[href]")]) {
    const href = normalizeWs(element.getAttribute?.("href") ?? "");
    if (!href.startsWith("http://") && !href.startsWith("https://")) continue;

    const anchor = normalizeWs(element.textContent ?? "");
    if (anchor.length < MIN_ANCHOR_CHARS) continue;

    // Search after the previous link first, so a phrase that repeats keeps its
    // order. When that fails, search the whole text: one anchor that matched a
    // later repeat of its words pushed the cursor past two source links of a
    // live article, and both went unseen.
    let at = findWhole(text, anchor, cursor);
    if (at < 0) at = findWhole(text, anchor, 0);
    if (at < 0) continue;
    if (at >= cursor) cursor = at + anchor.length;
    links.push({ href, text: anchor, start: at });
  }
  return links;
}

/** Return the links whose anchor sits inside a span of the text. */
export function linksInSpan(
  links: ArticleLink[],
  span: { start: number; end: number } | null,
): ArticleLink[] {
  if (!span) return [];
  return links.filter((link) => link.start >= span.start && link.start < span.end);
}

/**
 * Report whether a link leaves the site of the article.
 *
 * A link to another page of the same site is internal linking, never a source.
 */
export function isExternalLink(href: string, articleRef: string): boolean {
  const host = hostOf(href);
  if (!host) return false;
  const own = hostOf(articleRef);
  return own === "" ? true : host !== own;
}

/** Report whether two addresses point at the same host. */
export function sameHost(left: string, right: string): boolean {
  const host = hostOf(left);
  return host !== "" && host === hostOf(right);
}
