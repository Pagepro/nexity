/**
 * The dates of a page.
 *
 * This module is a port of `src/claim_source_reviewer/pipeline/dates.py`.
 *
 * The contradiction checks compare the date of a source against the date of
 * the article. A wrong date makes a current source look stale, or a stale
 * source look current, so the reader of the report cannot trust the age check.
 *
 * The `Last-Modified` header is the last answer, never the first. A host sets
 * it when it rebuilds the site, so it states the build date, not the
 * publication date.
 */

const JSON_LD_PUBLISHED = /"datePublished"\s*:\s*"([^"]{4,40})"/;
const JSON_LD_MODIFIED = /"dateModified"\s*:\s*"([^"]{4,40})"/;
const META_PUBLISHED =
  /<meta[^>]+(?:property|name)=["']article:published_time["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']article:published_time["']/i;
const META_MODIFIED =
  /<meta[^>]+(?:property|name)=["']article:modified_time["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']article:modified_time["']/i;
const TIME_TAG = /<time[^>]+datetime=["']([^"']+)["']/i;

/**
 * Read a date string. Return `null` when the string is not a date.
 *
 * The function accepts an ISO string with or without a time, and an HTTP date.
 */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const text = value.trim();
  if (!text) return null;
  // A bare year, or a plain number, is not a date. `Date` would read "2024" as
  // a year and return a date, which hides a fault.
  if (/^\d{1,4}$/.test(text)) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function firstGroup(match: RegExpMatchArray | null): string | null {
  if (!match) return null;
  for (const group of match.slice(1)) {
    if (group) return group;
  }
  return null;
}

export interface PageDates {
  publishedAt: Date | null;
  modifiedAt: Date | null;
}

/** Return the publication date and the modification date of a page. */
export function readDates(html: string, lastModifiedHeader?: string | null): PageDates {
  let publishedAt = parseDate(firstGroup(JSON_LD_PUBLISHED.exec(html)));
  let modifiedAt = parseDate(firstGroup(JSON_LD_MODIFIED.exec(html)));

  if (!publishedAt) publishedAt = parseDate(firstGroup(META_PUBLISHED.exec(html)));
  if (!modifiedAt) modifiedAt = parseDate(firstGroup(META_MODIFIED.exec(html)));
  if (!publishedAt) publishedAt = parseDate(firstGroup(TIME_TAG.exec(html)));
  if (!modifiedAt) modifiedAt = parseDate(lastModifiedHeader);

  return { publishedAt, modifiedAt };
}

/** Return the later of the two dates. */
export function newestDate(publishedAt: Date | null, modifiedAt: Date | null): Date | null {
  const dates = [publishedAt, modifiedAt].filter((date): date is Date => date !== null);
  if (dates.length === 0) return null;
  return dates.reduce((left, right) => (left > right ? left : right));
}
