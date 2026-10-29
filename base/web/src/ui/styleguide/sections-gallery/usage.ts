// Runs under `perspective: "published"`: the client default also returns drafts,
// which would double the counts.
import { defineQuery } from "groq";

import { client } from "@/sanity/lib/client";

import { SECTION_TYPES, SectionType } from "./fixtures-registry";

export interface SectionUsage {
  liveOccurrences: number;
  definedInBundles: number;
  documentTitles: string[];
}

export type UsageByType = Record<SectionType, SectionUsage>;

const USAGE_QUERY = defineQuery(`{
  "directTypes":   *[_type in ["page","blog-listing-page","case-studies-listing-page"]].sections[]._type,
  "globalTypes":   *[_type == "global-section"]{ "t": before[]._type + after[]._type }.t,
  "bundledTypes":  *[_type in ["page","blog-listing-page","case-studies-listing-page"]].sections[_type == "shared-section-ref"].sharedSections[]->sections[]._type,
  "globalBundled": *[_type == "global-section"]{ "t": (before[_type == "shared-section-ref"] + after[_type == "shared-section-ref"]).sharedSections[]->sections[]._type }.t,
  "bundleDefs":    *[_type == "shared-section"].sections[]._type,
  // Per-document: title + the distinct section types it renders (direct + bundled,
  // page sections + global before/after). Powers the "where used" hover.
  "docs": *[_type in ["page","blog-listing-page","case-studies-listing-page","global-section"]]{
    "title": coalesce(metadata.title, title, _type),
    "types": array::unique(
      coalesce(sections[]._type, [])
      + coalesce(sections[_type == "shared-section-ref"].sharedSections[]->sections[]._type, [])
      + coalesce(before[]._type, []) + coalesce(after[]._type, [])
      + coalesce((before[_type == "shared-section-ref"] + after[_type == "shared-section-ref"]).sharedSections[]->sections[]._type, [])
    )
  }
}`);

interface UsageQueryResult {
  directTypes: (string | null)[] | null;
  globalTypes: ((string | null)[] | null)[] | null;
  bundledTypes: (string | null)[] | null;
  globalBundled: ((string | null)[] | null)[] | null;
  bundleDefs: (string | null)[] | null;
  docs: { title: string; types: (string | null)[] | null }[] | null;
}

const flatten = (nested: ((string | null)[] | null)[] | null): (string | null)[] =>
  (nested ?? []).flat();

const tally = (...sources: (string | null)[][]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const source of sources) {
    for (const type of source) {
      if (type) counts.set(type, (counts.get(type) ?? 0) + 1);
    }
  }
  return counts;
};

export interface DocumentUsingSection {
  _id: string;
  _type: string;
  title: string;
}

const DOCS_USING_SECTION_QUERY = defineQuery(`*[
  (_type in ["page","blog-listing-page","case-studies-listing-page"] && (
    count(sections[_type == $type]) > 0 ||
    count(sections[_type == "shared-section-ref"].sharedSections[]->sections[_type == $type]) > 0
  )) ||
  (_type == "shared-section" && count(sections[_type == $type]) > 0) ||
  (_type == "global-section" && (
    count((before[] + after[])[_type == $type]) > 0 ||
    count((before[] + after[])[_type == "shared-section-ref"].sharedSections[]->sections[_type == $type]) > 0
  ))
]{
  _id,
  _type,
  "title": coalesce(metadata.title, title, _type)
}`);

export const getDocumentsUsingSection = async (
  type: SectionType,
): Promise<DocumentUsingSection[]> =>
  client.fetch<DocumentUsingSection[]>(
    DOCS_USING_SECTION_QUERY,
    { type },
    { perspective: "published", useCdn: true, stega: false },
  );

export const getSectionUsage = async (): Promise<UsageByType> => {
  const result = await client.fetch<UsageQueryResult>(
    USAGE_QUERY,
    {},
    { perspective: "published", useCdn: true, stega: false },
  );

  const liveOccurrences = tally(
    result.directTypes ?? [],
    flatten(result.globalTypes),
    result.bundledTypes ?? [],
    flatten(result.globalBundled),
  );
  const bundleDefs = tally(result.bundleDefs ?? []);

  const documentTitlesByType = new Map<string, string[]>();
  for (const doc of result.docs ?? []) {
    for (const type of doc.types ?? []) {
      if (!type) continue;
      const titles = documentTitlesByType.get(type) ?? [];
      titles.push(doc.title);
      documentTitlesByType.set(type, titles);
    }
  }

  return Object.fromEntries(
    SECTION_TYPES.map((type) => [
      type,
      {
        liveOccurrences: liveOccurrences.get(type) ?? 0,
        definedInBundles: bundleDefs.get(type) ?? 0,
        documentTitles: documentTitlesByType.get(type) ?? [],
      },
    ]),
  ) as UsageByType;
};
