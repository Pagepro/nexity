/**
 * Contradiction checks.
 *
 * This module is a port of
 * `src/claim_source_reviewer/pipeline/contradiction.py`.
 *
 * A contradiction says that the article is wrong or out of date. That is a
 * strong claim about published work, so the pipeline must not make it from one
 * weak signal. A source must pass four checks:
 *
 * 1. Source type. A page that is not evidence cannot deny a claim either.
 * 2. Time. A dated page must be newer than the article. A living document
 *    passes at any age, because it states the state of today.
 * 3. Version scope. When the claim names a version, the page must name that
 *    version or a later one.
 * 4. Count. Two sources on two different hosts must agree.
 *
 * Read `docs/CONTRADICTION-CHECKS.md` for the reasoning behind each check.
 */

import { TemporalRelation } from "./models.js";
import { VERSION_PATTERN, fold } from "./textops.js";

export const MIN_SOURCES_FOR_CONFIRMED = 2;

// A product version is a name and a number, such as `Next.js 14` or
// `React Native 0.81`. A bare dotted number is a version as well.
const PRODUCT_VERSION = /\b([A-Z][A-Za-z0-9.+#-]{1,24})\s+v?(\d{1,3}(?:\.\d+)*)\b/g;

// A month before a year looks like a product version. It is a date.
const MONTHS = new Set([
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
]);

/** Return a comparable form of a version string. */
export function versionKey(value: string): number[] {
  return value
    .toLowerCase()
    .replace(/^v/, "")
    .split(".")
    .map((part) => {
      const digits = part.replace(/\D/g, "");
      return digits ? Number.parseInt(digits, 10) : 0;
    });
}

function compareVersions(a: number[], b: number[]): number {
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const left = a[index] ?? 0;
    const right = b[index] ?? 0;
    if (left !== right) return left < right ? -1 : 1;
  }
  return 0;
}

function highest(values: string[]): number[] {
  let best = versionKey(values[0]!);
  for (const value of values.slice(1)) {
    const candidate = versionKey(value);
    if (compareVersions(candidate, best) > 0) best = candidate;
  }
  return best;
}

/**
 * Return the versions that a text states, keyed by the product name.
 *
 * The function pairs a name with its number, so a claim about `Next.js 14` is
 * never compared against `React 19`. It skips a month name, because
 * `October 2024` is a date and not a version.
 */
export function productVersions(text: string): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const add = (key: string, version: string) => {
    const list = found.get(key);
    if (list) list.push(version);
    else found.set(key, [version]);
  };

  for (const match of text.matchAll(new RegExp(PRODUCT_VERSION.source, "g"))) {
    const name = match[1]!;
    if (MONTHS.has(name.toLowerCase())) continue;
    add(fold(name), match[2]!);
  }
  for (const match of text.matchAll(new RegExp(VERSION_PATTERN.source, "gi"))) {
    add("", match[0]!);
  }
  return found;
}

/**
 * Report whether a page covers the version that the claim names.
 *
 * A page about Next.js 13 is not authoritative for a claim about Next.js 14.
 * The function compares one product at a time. It returns `true` when the claim
 * names no version, and when the page names no version of that same product.
 */
export function versionScopeOk(claimText: string, pageText: string): boolean {
  const wanted = productVersions(claimText);
  if (wanted.size === 0) return true;
  const found = productVersions(pageText);

  for (const [name, versions] of wanted) {
    if (!name) continue;
    const pageVersions = found.get(name);
    if (!pageVersions || pageVersions.length === 0) continue;
    if (compareVersions(highest(pageVersions), highest(versions)) < 0) return false;
  }
  return true;
}

export interface DatedSource {
  isLivingDocument: boolean;
  publishedAt: Date | null;
  modifiedAt: Date | null;
}

/**
 * Return the age of a source against the article.
 *
 * A source that is older than the article cannot prove that the article is out
 * of date. The article may describe a later state.
 */
export function temporalRelation(
  source: DatedSource,
  articleDate: Date | null,
): TemporalRelation {
  if (source.isLivingDocument) return TemporalRelation.LIVING;
  const sourceDate = source.modifiedAt ?? source.publishedAt;
  if (!sourceDate || !articleDate) return TemporalRelation.UNDATED;
  return sourceDate.getTime() >= articleDate.getTime()
    ? TemporalRelation.SOURCE_NEWER
    : TemporalRelation.SOURCE_OLDER;
}
