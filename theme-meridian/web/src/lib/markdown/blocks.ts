import { cleanText, escapeTableCell, escapeUrl, markdownText } from "./escape";
import type { MarkdownImage } from "./types";

// Blocks take already-escaped text unless their doc says they escape a CMS value.

const BULLET = /^([-*]) /;

const trailingBullet = (block: string): string | null => {
  const lines = block.split("\n");
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (/^\s/.test(lines[index])) continue;

    return BULLET.exec(lines[index])?.[1] ?? null;
  }

  return null;
};

const flipLeadingLists = (block: string): string => {
  const lines = block.split("\n");
  let index = 0;

  for (; index < lines.length; index += 1) {
    const line = lines[index];
    const bullet = BULLET.exec(line)?.[1];

    if (bullet) {
      lines[index] = `${bullet === "-" ? "*" : "-"}${line.slice(1)}`;
    } else if (line === "") {
      if (!/^([-*] |\s)/.test(lines[index + 1] ?? "")) break;
    } else if (!/^\s/.test(line)) {
      break;
    }
  }

  return lines.join("\n");
};

// CommonMark merges two adjacent lists with the same bullet despite the blank line,
// so the second one switches bullets.
export const joinBlocks = (blocks: (string | null | undefined | false)[]): string =>
  blocks
    .map((block) => (typeof block === "string" ? block.trim() : ""))
    .filter(Boolean)
    .reduce<string[]>((joined, block) => {
      const previousBullet = joined.length ? trailingBullet(joined.at(-1) ?? "") : null;
      const bullet = BULLET.exec(block)?.[1];

      joined.push(bullet && bullet === previousBullet ? flipLeadingLists(block) : block);

      return joined;
    }, [])
    .join("\n\n");

// Clamped to 2–6: `#` belongs to the document title.
export const heading = (level: number, text: string): string => {
  const content = text.replace(/\s+/g, " ").trim();
  if (!content) return "";

  return `${"#".repeat(Math.min(6, Math.max(2, level)))} ${content}`;
};

/** Escapes the CMS string. */
export const paragraph = (value: unknown): string =>
  markdownText(value).replace(/\n+/g, "  \n");

/** Items are already rendered Markdown (not escaped here). */
export const bulletList = (items: (string | null | undefined)[]): string =>
  items
    .map((item) => (item ?? "").trim())
    .filter(Boolean)
    .map((item) => `- ${item.replace(/\n/g, "\n  ")}`)
    .join("\n");

/** Escapes each CMS string. */
export const textList = (
  values: (string | null | undefined)[] | null | undefined,
): string => bulletList((values ?? []).map((value) => markdownText(value)));

export const blockquote = (content: string): string => {
  const body = content.trim();
  if (!body) return "";

  return body
    .split("\n")
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
};

export const inlineLink = (text: string, url: string | null | undefined): string => {
  const label = text.trim();
  if (!url) return label;

  return `[${label || url}](${escapeUrl(url)})`;
};

/** `header` and `rows` hold already-escaped inline Markdown. */
export const table = (header: string[], rows: string[][]): string => {
  if (header.length === 0) return "";

  const width = Math.max(header.length, ...rows.map((row) => row.length));
  const toRow = (cells: string[]) =>
    `| ${Array.from({ length: width }, (_, index) => escapeTableCell(cells[index] ?? "")).join(" | ")} |`;

  return [
    toRow(header),
    `| ${Array.from({ length: width }, () => "---").join(" | ")} |`,
    ...rows.map(toRow),
  ].join("\n");
};

export const presenceHint = (description: string): string => `[${description}]`;

export const imageAlt = (image: MarkdownImage | null | undefined): string =>
  cleanText(image?.role) === "decorative"
    ? ""
    : cleanText(image?.alt) || cleanText(image?.image?.asset?.altText);

export const imageHint = (image: MarkdownImage | null | undefined): string => {
  const alt = imageAlt(image);

  return alt ? presenceHint(`Image: ${markdownText(alt)}`) : "";
};

export const labelLine = (value: unknown): string => {
  const text = markdownText(value);

  return text ? `*${text}*` : "";
};
