/**
 * Page text extraction and failure classification.
 *
 * This module is a port of `src/claim_source_reviewer/pipeline/fetch.py`.
 *
 * Python uses `trafilatura`. TypeScript has no equivalent, so this module uses
 * `@mozilla/readability` with a `linkedom` document, and falls back to a tag
 * strip when Readability returns nothing.
 *
 * The two extractors never produce the same text. The port contract asks for
 * the same **gate answers**, not the same text. Run
 * `npx tsx scripts/compare-extraction.ts` to measure that on the 84 corpus
 * pages.
 *
 * The module never returns empty text with the status `ok`. A page the fetcher
 * cannot read carries a cause, so the verifier rejects it as `fetch_failed`
 * instead of inventing a content reason.
 */

import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

import { FetchStatus } from "./models.js";
import { normalizeWs } from "./textops.js";

export const ALLOWED_CONTENT_TYPES = [
  "text/html",
  "application/xhtml",
  "text/plain",
  "text/markdown",
];

const PAYWALL_MARKERS = [
  "subscribe to continue",
  "subscribers only",
  "already a subscriber",
  "create a free account to continue",
  "register to continue reading",
  "this content is for members",
  "you have reached your article limit",
];
const JS_MARKERS = [
  "enable javascript",
  "javascript is required",
  "please turn on javascript",
  "you need to enable javascript to run this app",
];
/**
 * Markers of a page that asks the visitor to prove it is a browser.
 *
 * These hosts answer a plain HTTP client with a challenge page instead of the
 * content. The status code alone is misleading: contentful.com returns HTTP
 * 429, which reads as "the server is busy, try later", while the real cause is
 * a browser check that no retry and no header will ever pass. A run reported
 * "HTTP 429" four times and sent a person off to wait.
 */
const CHALLENGE_MARKERS = [
  "security checkpoint",
  "we're verifying your browser",
  "we are verifying your browser",
  "checking your browser before accessing",
  "just a moment...",
  "enable javascript and cookies to continue",
  "a required part of this site couldn't load",
  "attention required!",
  "please verify you are a human",
  "ddos protection by",
  "client challenge",
];

/**
 * Words that name a challenge when they stand in the title of a page.
 *
 * drupal.org answers with `<title>Client Challenge</title>` and a body that
 * carries none of the phrases above, so the phrase list alone read it as a
 * page that needs JavaScript. The title is the more reliable signal.
 */
const CHALLENGE_TITLE_WORDS = ["challenge", "checkpoint", "verifying", "are you human", "access denied"];

const BLOCK_MARKERS = [
  "access denied",
  "are you a robot",
  "verify you are human",
  "request blocked",
  "cloudflare",
  "captcha",
];

const SCRIPT_TAG = /<script\b/gi;

/** Tags that never hold the text of a claim. */
const STRIP_TAGS = [
  "script",
  "style",
  "noscript",
  "nav",
  "footer",
  "header",
  "aside",
  "form",
  "button",
  "svg",
  "iframe",
  "dialog",
  "template",
  "select",
  "input",
  "label",
  "menu",
];

// `figure` is not on the list. WordPress wraps a table in `<figure
// class="wp-block-table">`, so stripping it removed a comparison table with
// real facts in it. A live run then lost a claim, and with it a contradiction
// that the Python run had found. Removing `figure` costs nothing on the
// corpus: the gate agreement stays at 484 of 504.

/** Furniture that a page marks by an attribute rather than by a tag. */
const FURNITURE_SELECTORS = [
  "[aria-hidden='true']",
  "[hidden]",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  "[role='search']",
  "[role='dialog']",
  "[role='menu']",
];

/** Containers that hold the main text. The first match with real text wins. */
const MAIN_SELECTORS = ["main", "[role='main']", "article", "#main-content", "#content", ".markdown-body"];

/** Blocks that a link list can fill. */
const LINK_BLOCK_TAGS = ["ul", "ol", "div", "section", "table"];

/** The share of linked text above which a block counts as a link list. */
const LINK_DENSITY_LIMIT = 0.8;

/** Non-link text that keeps a block, even when the block is link dense. */
const KEEP_PROSE_CHARS = 200;

/** The shortest block that the link rule reads. */
const MIN_BLOCK_CHARS = 50;

/**
 * The part of a DOM node that this module reads.
 *
 * `linkedom` carries no DOM library types, so the module states the shape it
 * needs instead of depending on the browser types.
 */
export interface Node {
  textContent: string | null;
  getAttribute?(name: string): string | null;
  querySelector(selector: string): Node | null;
  querySelectorAll(selector: string): Iterable<Node>;
  remove(): void;
}

export interface ExtractedPage {
  title: string;
  text: string;
}

/**
 * Report whether the body is markdown or plain text rather than HTML.
 *
 * Some hosts answer an agent with markdown. Four Vercel documentation pages in
 * the corpus arrive as markdown with a YAML front matter block, so the HTML
 * parser returns a document with no root element and the page reads as empty.
 */
function looksLikeMarkdown(body: string): boolean {
  const head = body.slice(0, 400).trimStart();
  if (head.startsWith("---") && /\n[a-z_]+:\s/i.test(head)) return true;
  return !/<html|<body|<div|<p[\s>]/i.test(body.slice(0, 2000));
}

/** Return the title of a markdown page from its front matter or first heading. */
function markdownTitle(body: string): string {
  const front = /^---\s*[\s\S]*?\btitle:\s*(.+)$/im.exec(body.slice(0, 800));
  if (front?.[1]) return normalizeWs(front[1].replace(/^["']|["']$/g, ""));
  const heading = /^#\s+(.+)$/m.exec(body.slice(0, 800));
  return heading?.[1] ? normalizeWs(heading[1]) : "";
}

/**
 * Remove every block whose text sits mostly inside links.
 *
 * `trafilatura` drops a link list. The tag strip does not, so a blog index or a
 * release index used to carry every version number of the site into the text.
 * The value gate then found a number that the page does not state, which is the
 * direction that costs citation quality.
 *
 * A block with `KEEP_PROSE_CHARS` of text outside its links stays. That rule
 * keeps a post list that shows an excerpt under each link.
 */
function dropLinkLists(root: Node): void {
  for (const tag of LINK_BLOCK_TAGS) {
    for (const element of [...root.querySelectorAll(tag)]) {
      // The lengths use the collapsed text. Indentation between the items of a
      // list would otherwise count as text and hide the link density.
      const whole = normalizeWs(element.textContent ?? "");
      if (whole.length < MIN_BLOCK_CHARS) continue;

      let linked = 0;
      for (const anchor of [...element.querySelectorAll("a")]) {
        linked += normalizeWs(anchor.textContent ?? "").length;
      }
      if (linked / whole.length <= LINK_DENSITY_LIMIT) continue;
      if (whole.length - linked >= KEEP_PROSE_CHARS) continue;
      element.remove();
    }
  }
}

/** Return the container that holds the main text, or the body. */
function mainContainer(body: Node | null, document: Node): Node | null {
  for (const selector of MAIN_SELECTORS) {
    const found = document.querySelector(selector);
    if (found && (found.textContent ?? "").trim().length > 200) return found;
  }
  return body;
}

/**
 * Return the main container of a page after the chrome is gone.
 *
 * The text of a page and the links of a page must come from the same place. The
 * first link reader searched the whole document, so a tag list in the sidebar
 * put "Expo" into the article, found inside the word "Export".
 */
function cleanedMain(html: string): { root: Node | null; beforeLinkRule: string } {
  const { document: forStrip } = parseHTML(html);
  for (const tag of STRIP_TAGS) {
    for (const element of [...forStrip.querySelectorAll(tag)]) element.remove();
  }
  for (const selector of FURNITURE_SELECTORS) {
    try {
      for (const element of [...forStrip.querySelectorAll(selector)]) element.remove();
    } catch {
      // A parser that rejects the selector must not stop the run.
    }
  }
  const root = mainContainer(forStrip.body as Node | null, forStrip as unknown as Node);
  const beforeLinkRule = normalizeWs(root?.textContent ?? "");
  if (root) dropLinkLists(root);
  return { root, beforeLinkRule };
}

/** Return the container that the main text comes from, or `null`. */
export function mainContentRoot(html: string): Node | null {
  if (looksLikeMarkdown(html)) return null;
  try {
    return cleanedMain(html).root;
  } catch {
    return null;
  }
}

/** Return the page title and the main text of a page. */
export function extractMainText(html: string): ExtractedPage {
  let title = "";
  let text = "";

  if (looksLikeMarkdown(html)) {
    // The body carries the text already. Read it as it is, so the gates see the
    // same words that a reader sees.
    //
    // The title stays empty on purpose. `markdownTitle` can read the front
    // matter, and that is the better answer, but the Python extractor returns
    // an empty title here. The two implementations stay aligned first;
    // task 7.5a in `docs/PLAN.md` improves both together.
    void markdownTitle;
    return { title: "", text: html.trim() };
  }

  try {
    const { document } = parseHTML(html);
    if (!document.documentElement) return { title: "", text: html.trim() };
    title = normalizeWs(document.querySelector("title")?.textContent ?? "");

    // Strip the chrome and read the main container. A measurement over the 84
    // corpus pages put this strategy at 55 of 68 sentence controls, against 38
    // for `@mozilla/readability` and 8 for `defuddle`. Readability is tuned for
    // an article; most sources here are documentation pages.
    //
    // The four steps run in this order: tags, attribute furniture, main
    // container, link lists. Read `docs/PORT-CONTRACT.md` section 5.2 for the
    // measured effect of each step.
    const { root, beforeLinkRule } = cleanedMain(html);
    text = normalizeWs(root?.textContent ?? "");

    if (!beforeLinkRule) {
      // Readability sometimes reads a page that the strip path leaves empty.
      //
      // The test reads the text from before the link rule on purpose. A page
      // that the link rule empties is a link list, and that is an answer. A
      // fallback there would put the list back.
      const { document: forReader } = parseHTML(html);
      const article = new Readability(forReader as never, { charThreshold: 100 }).parse();
      if (article?.textContent) text = article.textContent;
    }
  } catch {
    // A broken document must not stop the run. The caller sees empty text and
    // classifies the page with `classifyThinPage`.
    text = text || "";
  }

  return { title, text: text.trim() };
}

/**
 * Report whether the body is a browser check rather than the page.
 *
 * The check reads the head of the document, where a challenge page states its
 * purpose. A long article that quotes one of these phrases deeper in the text
 * is not a challenge.
 */
export function looksLikeChallenge(html: string): boolean {
  const head = html.slice(0, 4000).toLowerCase();
  if (CHALLENGE_MARKERS.some((marker) => head.includes(marker))) return true;
  const title = challengeName(html).toLowerCase();
  return title !== "" && CHALLENGE_TITLE_WORDS.some((word) => title.includes(word));
}

/** Return the name of the check that a challenge page runs, or an empty string. */
export function challengeName(html: string): string {
  const title = /<title[^>]*>([^<]{2,120})<\/title>/i.exec(html.slice(0, 4000));
  return title?.[1] ? normalizeWs(title[1]) : "";
}

/** Return the cause of a page with too little text. */
export function classifyThinPage(
  html: string,
  text: string,
  minChars: number,
): { status: FetchStatus; detail: string } {
  const low = html.toLowerCase();

  // The browser check is tested first. It is the most specific diagnosis, and
  // it is the only one that tells a person the page will never arrive by
  // retrying. A challenge page also mentions JavaScript, so a later test would
  // report the wrong cause.
  if (looksLikeChallenge(html)) {
    const name = challengeName(html);
    return {
      status: FetchStatus.BLOCKED,
      detail:
        `The host runs a browser check${name ? ` (${name})` : ""}. ` +
        "A plain HTTP client cannot pass it, and no retry will. Open the page in a browser to read it.",
    };
  }

  if (PAYWALL_MARKERS.some((marker) => low.includes(marker))) {
    return {
      status: FetchStatus.PAYWALL,
      detail: "The page asks for a subscription or an account.",
    };
  }
  if (JS_MARKERS.some((marker) => low.includes(marker))) {
    return {
      status: FetchStatus.JS_REQUIRED,
      detail: "The page needs JavaScript to show its text.",
    };
  }
  if (BLOCK_MARKERS.some((marker) => low.includes(marker))) {
    return {
      status: FetchStatus.BLOCKED,
      detail: "The page blocked the automatic request.",
    };
  }
  if ((html.match(SCRIPT_TAG) ?? []).length >= 5) {
    // A thin page with many scripts is a rendered application, not a short
    // article. It needs a browser.
    return {
      status: FetchStatus.JS_REQUIRED,
      detail: `The page returned ${text.length} characters and many scripts. A browser is required.`,
    };
  }
  return {
    status: FetchStatus.TOO_SHORT,
    detail: `The page holds ${text.length} characters. The limit is ${minChars}.`,
  };
}

/** Return the fetch status of a page that the caller already downloaded. */
export function statusOf(html: string, text: string, minChars: number): {
  status: FetchStatus;
  detail: string;
} {
  if (text.length >= minChars) return { status: FetchStatus.OK, detail: "" };
  return classifyThinPage(html, text, minChars);
}
