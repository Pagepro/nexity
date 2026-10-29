import { stegaClean } from "@sanity/client/stega";

// Every CMS string passes through `cleanText`: a second line of defence against the
// invisible stega characters a draft read would embed.
export const cleanText = (value: unknown): string => cleanInline(value).trim();

export const cleanInline = (value: unknown): string =>
  typeof value === "string" ? stegaClean(value) : "";

// Deliberately light: an agent reads this, so escaping everything costs more than it saves.
export const escapeMarkdown = (text: string): string =>
  text
    .replace(/[\\`*[\]<]/g, (character) => `\\${character}`)
    .replace(/(^|[^\p{L}\p{N}])_|_(?=$|[^\p{L}\p{N}])/gu, (match) =>
      match.replace("_", "\\_"),
    )
    .replace(/^(\s*)(#{1,6}(?=\s|$)|>|[-+](?=\s|$)|=+\s*$)/gm, "$1\\$2")
    .replace(/^(\s*\d+)([.)])(?=\s|$)/gm, "$1\\$2");

export const markdownText = (value: unknown): string => escapeMarkdown(cleanText(value));

export const escapeTableCell = (text: string): string =>
  text.replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|");

// JSON strings are valid YAML double-quoted scalars.
export const yamlString = (value: string): string => JSON.stringify(value);

export const escapeUrl = (url: string): string =>
  url.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29");
