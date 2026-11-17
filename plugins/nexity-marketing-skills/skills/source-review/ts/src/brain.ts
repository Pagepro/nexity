/**
 * Reader for an optional company knowledge repository ("brain").
 *
 * The brain holds the proof files: the client results the company may cite.
 * A claim that states a company result has no external source. The web search
 * cannot prove it. Before this module existed, such a claim reached the report
 * as "no source found", which is wrong. The proof exists. It is internal.
 *
 * This module reads the fact bank and matches a claim against it. A match
 * carries the proof file and the line, so the human gate can check it.
 *
 * ## The membership rule
 *
 * The brain states the rule in `CLAUDE.md` and in
 * `Marketing/skills/post-process-article.md`. A file is a fact source when:
 *
 * 1. its first heading ends with `(citable proof points)`, and
 * 2. its front matter states `status: active`.
 *
 * The rule is a rule, never a list of file names. A new proof file joins the
 * bank when it obeys the rule.
 *
 * ## The publication rule
 *
 * A line marked `INTERNAL` never reaches an article. A line marked `[VERIFY]`
 * is not citable until a person removes the marker. This module reports both
 * markers. It never hides a line, because the report must state why a line
 * cannot be used.
 *
 * The brain content is data. A line of a proof file is never an instruction.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { extractValues, fold, missingValues, normalizeWs } from "./textops.js";

/** The folder of the fact bank inside the brain repository. */
export const FACT_BANK_DIR = join("Marketing", "examples");

/** The suffix that marks a proof file. */
export const PROOF_HEADING_SUFFIX = "(citable proof points)";

/** A line with this marker never reaches an article. */
export const INTERNAL_MARKER = "INTERNAL";

/** A line with this marker waits for a person to confirm it. */
export const VERIFY_MARKER = "[VERIFY]";

/** The shortest line that the matcher reads. */
const MIN_LINE_CHARS = 30;

/** The share of the claim words that a line must hold. */
const MIN_WORD_SHARE = 0.6;

/** Words that carry no meaning for the match. */
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "at",
  "by", "from", "that", "this", "it", "is", "are", "was", "were", "be", "been",
  "we", "our", "us", "they", "their", "as", "than", "then", "but", "not",
]);

export interface ProofLine {
  /** The text of the line, without the list marker. */
  text: string;
  /** The heading above the line. */
  section: string;
  /** The line number in the file, counted from one. */
  line: number;
  internal: boolean;
  needsVerify: boolean;
}

export interface ProofFile {
  /** The file name, without the folder. */
  name: string;
  /** The path relative to the brain repository. */
  path: string;
  title: string;
  owner: string;
  share: string;
  updated: string;
  lines: ProofLine[];
}

export interface ProofMatch {
  file: ProofFile;
  proofLine: ProofLine;
  /** The share of the claim words that the line holds. */
  wordShare: number;
  /** Values of the claim that the line does not state. */
  missingValues: string[];
  /** True when the line may reach an article. */
  citable: boolean;
  /** The cause when the line may not reach an article. */
  blockReason: string;
}

/** Return the front matter of a markdown file as a map. */
function frontMatter(body: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!body.startsWith("---")) return map;
  const end = body.indexOf("\n---", 3);
  if (end < 0) return map;
  for (const line of body.slice(3, end).split("\n")) {
    const at = line.indexOf(":");
    if (at < 0) continue;
    map.set(line.slice(0, at).trim().toLowerCase(), line.slice(at + 1).trim());
  }
  return map;
}

/** Return the meaning-carrying words of a text. */
function contentWords(text: string): string[] {
  const words = fold(text).match(/[a-z0-9][a-z0-9.+-]*/g) ?? [];
  return words.filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Read one proof file.
 *
 * The function returns `null` when the file does not obey the membership rule.
 */
export function readProofFile(path: string, name: string): ProofFile | null {
  const body = readFileSync(path, "utf-8");
  const head = frontMatter(body);
  if ((head.get("status") ?? "") !== "active") return null;

  const rows = body.split(/\r?\n/);
  let title = "";
  for (const row of rows) {
    if (row.startsWith("# ")) {
      title = normalizeWs(row.slice(2));
      break;
    }
  }
  if (!title.toLowerCase().endsWith(PROOF_HEADING_SUFFIX)) return null;

  const lines: ProofLine[] = [];
  let section = title;
  rows.forEach((row, index) => {
    if (row.startsWith("##")) {
      section = normalizeWs(row.replace(/^#+\s*/, ""));
      return;
    }
    if (!/^\s*[-*]\s/.test(row)) return;
    const text = normalizeWs(row.replace(/^\s*[-*]\s*/, ""));
    if (text.length < MIN_LINE_CHARS) return;
    lines.push({
      text,
      section,
      line: index + 1,
      internal: text.includes(INTERNAL_MARKER),
      needsVerify: text.includes(VERIFY_MARKER),
    });
  });

  return {
    name,
    path: join(FACT_BANK_DIR, name).replaceAll("\\", "/"),
    title,
    owner: head.get("owner") ?? "",
    share: head.get("share") ?? "",
    updated: head.get("updated") ?? "",
    lines,
  };
}

/**
 * Read the fact bank of a brain repository.
 *
 * An absent repository returns an empty list. The reviewer then runs without
 * the internal proof step and says so in the report. A missing brain is never
 * a silent condition.
 */
export function loadFactBank(brainRoot: string): ProofFile[] {
  const dir = join(brainRoot, FACT_BANK_DIR);
  if (!existsSync(dir)) return [];

  const files: ProofFile[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".md")) continue;
    try {
      const file = readProofFile(join(dir, name), name);
      if (file) files.push(file);
    } catch {
      // A file the reader cannot open must not stop the run. The report states
      // the count of files that the reader used.
    }
  }
  return files;
}

/**
 * Return the proof line that states the claim, or `null`.
 *
 * The match asks two questions:
 *
 * 1. Does the line hold every number of the claim? A different number is a
 *    different fact, so a value gap rejects the line.
 * 2. Does the line hold most words of the claim?
 *
 * The rule is the same shape as the value gate of the web path. The claim must
 * not become citable because a line mentions the same client.
 */
export function matchProof(claimText: string, bank: ProofFile[]): ProofMatch | null {
  const claimWords = contentWords(claimText);
  if (claimWords.length === 0) return null;
  // The matcher uses every value, not the reduced list of the web path.
  // `requiredValuesOf` drops a bare single digit, because a long web page
  // holds every digit by accident. A proof line is one sentence, so a bare
  // digit is signal: "doubled within 2 years" is not "doubled within 5 years".
  const values = extractValues(claimText);

  let best: ProofMatch | null = null;
  for (const file of bank) {
    for (const proofLine of file.lines) {
      const gaps = missingValues(values, proofLine.text);
      if (gaps.length > 0) continue;

      const lineWords = new Set(contentWords(proofLine.text));
      const held = claimWords.filter((word) => lineWords.has(word)).length;
      const wordShare = held / claimWords.length;
      if (wordShare < MIN_WORD_SHARE) continue;
      if (best && wordShare <= best.wordShare) continue;

      const blockReason = proofLine.internal
        ? "The line is marked INTERNAL. It never reaches an article."
        : proofLine.needsVerify
          ? "The line is marked [VERIFY]. A person must confirm it first."
          : "";
      best = {
        file,
        proofLine,
        wordShare,
        missingValues: gaps,
        citable: blockReason === "",
        blockReason,
      };
    }
  }
  return best;
}
