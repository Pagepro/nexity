/**
 * The section that each part of an article belongs to.
 *
 * A source review is not equally useful in every part of an article. The body
 * carries the argument, and a claim there needs a source. An FAQ block answers
 * a side question in two sentences, and the house style gives it no citation.
 *
 * A live run put both of its sources on FAQ answers, which are the last 11
 * percent of the article. The report looked full and helped nobody.
 *
 * This module reads the headings of a page and maps each one to an offset in
 * the extracted text, so a claim can state the section it came from. Which
 * section needs no source is policy data, never a rule in this file.
 *
 * The module never changes the extracted text. The gates read the same text as
 * before, so the port contract is untouched.
 */

import { parseHTML } from "linkedom";

import { normalizeWs } from "./textops.js";

const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"];

/** The shortest heading that the reader keeps. */
const MIN_HEADING_CHARS = 2;

/** One heading of an article, with its place in the extracted text. */
export interface Section {
  heading: string;
  level: number;
  /** Offset of the heading in the extracted text, or -1 when it is absent. */
  start: number;
}

/**
 * Return the sections of a page, in document order.
 *
 * The offset comes from a search in the extracted text, because the extractor
 * collapses whitespace and drops furniture. The search starts after the
 * previous heading, so a heading that repeats keeps its order.
 */
export function readSections(html: string, text: string): Section[] {
  let document;
  try {
    ({ document } = parseHTML(html));
  } catch {
    return [];
  }
  if (!document.documentElement) return [];

  const sections: Section[] = [];
  let cursor = 0;
  for (const element of [...document.querySelectorAll(HEADING_TAGS.join(","))]) {
    const heading = normalizeWs(element.textContent ?? "");
    if (heading.length < MIN_HEADING_CHARS) continue;
    const level = Number(element.tagName.slice(1)) || 1;

    const at = text.indexOf(heading, cursor);
    if (at >= 0) cursor = at + heading.length;
    sections.push({ heading, level, start: at });
  }
  return sections;
}

/**
 * Return the heading that covers an offset, or an empty string.
 *
 * A claim belongs to the last heading that stands before it.
 */
export function sectionAt(sections: Section[], offset: number): string {
  let heading = "";
  for (const section of sections) {
    if (section.start < 0 || section.start > offset) continue;
    heading = section.heading;
  }
  return heading;
}

/**
 * Report whether a heading opens a block that needs no external source.
 *
 * The list is policy data. This function only matches it.
 */
export function needsNoSource(heading: string, markers: string[]): boolean {
  if (!heading) return false;
  const low = heading.toLowerCase();
  return markers.some((marker) => low.includes(marker.toLowerCase()));
}
