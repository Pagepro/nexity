/**
 * Fuzzy string comparison.
 *
 * The Python implementation uses `rapidfuzz`. TypeScript has no equivalent, so
 * this module implements the two functions that the pipeline needs.
 *
 * The port contract asks for the decision at the threshold, not for the same
 * score. Read `docs/PORT-CONTRACT.md` section 3.
 *
 * `ratio` is the normalised indel similarity, the same measure that `rapidfuzz`
 * uses:
 *
 *     ratio(a, b) = 100 * 2 * lcs(a, b) / (a.length + b.length)
 *
 * `partialRatio` finds the window of the long string that matches the short
 * string best. A full scan costs too much on a page of 45000 characters, so the
 * function first looks for candidate windows with an exact k-gram match, the
 * same idea that `difflib` and `rapidfuzz` use with matching blocks.
 */

/** Length of the longest common subsequence. */
export function lcsLength(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0;

  // Keep the shorter string in the inner loop, so the row stays small.
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  const row = new Uint32Array(short.length + 1);

  for (let i = 0; i < long.length; i += 1) {
    let previousDiagonal = 0;
    const longChar = long[i];
    for (let j = 0; j < short.length; j += 1) {
      const current = row[j + 1]!;
      row[j + 1] =
        longChar === short[j]
          ? previousDiagonal + 1
          : Math.max(current, row[j]!);
      previousDiagonal = current;
    }
  }
  return row[short.length]!;
}

/** Normalised indel similarity, from 0 to 100. */
export function ratio(a: string, b: string): number {
  const total = a.length + b.length;
  if (total === 0) return 100;
  return (200 * lcsLength(a, b)) / total;
}

export interface Alignment {
  /** Similarity of the best window, from 0 to 100. */
  score: number;
  /** Start of the best window in the long string. */
  destStart: number;
  /** End of the best window in the long string, exclusive. */
  destEnd: number;
}

const KGRAM = 12;
const MAX_CANDIDATES = 60;

/** Return the window start positions that deserve a full comparison. */
function candidateStarts(needle: string, haystack: string): number[] {
  const starts = new Set<number>();

  // A k-gram of the needle that also appears in the haystack marks an
  // alignment. Sample several offsets, so one edit cannot hide every anchor.
  if (needle.length >= KGRAM) {
    const offsets = new Set<number>([0]);
    const step = Math.max(1, Math.floor((needle.length - KGRAM) / 8));
    for (let offset = 0; offset + KGRAM <= needle.length; offset += step) {
      offsets.add(offset);
    }
    offsets.add(needle.length - KGRAM);

    for (const offset of offsets) {
      const gram = needle.slice(offset, offset + KGRAM);
      let from = 0;
      for (;;) {
        const hit = haystack.indexOf(gram, from);
        if (hit < 0) break;
        starts.add(Math.max(0, hit - offset));
        from = hit + 1;
        if (starts.size > MAX_CANDIDATES) break;
      }
      if (starts.size > MAX_CANDIDATES) break;
    }
  }

  // No anchor found. Scan coarsely, so a needle with many small edits still
  // gets compared.
  if (starts.size === 0) {
    const step = Math.max(1, Math.floor(needle.length / 4));
    for (let start = 0; start <= haystack.length; start += step) {
      starts.add(start);
      if (starts.size > MAX_CANDIDATES) break;
    }
  }
  return [...starts];
}

/**
 * Return the best alignment of the short string inside the long string.
 *
 * The function mirrors `rapidfuzz.fuzz.partial_ratio_alignment`. It returns
 * `null` when either string is empty.
 */
export function partialRatioAlignment(a: string, b: string): Alignment | null {
  if (a.length === 0 || b.length === 0) return null;

  const swapped = a.length > b.length;
  const needle = swapped ? b : a;
  const haystack = swapped ? a : b;

  if (needle.length === haystack.length) {
    return { score: ratio(needle, haystack), destStart: 0, destEnd: haystack.length };
  }

  let best: Alignment = { score: 0, destStart: 0, destEnd: 0 };

  // The window is never longer than the needle. `rapidfuzz` slides a window of
  // the needle length and reports the matching region inside it, so the region
  // can be shorter but never longer.
  //
  // A wider window raised the score above the real similarity. A quote that
  // replaced a person's name then passed the quote gate, which the Python
  // implementation refuses. Read `docs/PORT-CONTRACT.md` section 4.
  const widths = new Set<number>();
  for (const factor of [0.75, 0.85, 0.92, 1]) {
    widths.add(Math.max(1, Math.round(needle.length * factor)));
  }

  for (const start of candidateStarts(needle, haystack)) {
    for (const width of widths) {
      const from = Math.max(0, Math.min(start, haystack.length - 1));
      const to = Math.min(haystack.length, from + width);
      if (to <= from) continue;
      const score = ratio(needle, haystack.slice(from, to));
      if (score > best.score) {
        best = { score, destStart: from, destEnd: to };
      }
      if (best.score >= 100) return best;
    }
  }
  return best.score > 0 ? trim(needle, haystack, best) : best;
}

const TRIM_STEPS = 24;

/**
 * Shrink a window while the score does not fall.
 *
 * `rapidfuzz` reports the matching region, not the whole window. Without this
 * pass the window keeps the characters that follow the match, and the caller
 * reports a longer text than Python does.
 */
function trim(needle: string, haystack: string, window: Alignment): Alignment {
  let best = window;

  for (let step = 0; step < TRIM_STEPS; step += 1) {
    if (best.destEnd - best.destStart <= 1) break;
    const shorter = haystack.slice(best.destStart, best.destEnd - 1);
    const score = ratio(needle, shorter);
    if (score < best.score) break;
    best = { score, destStart: best.destStart, destEnd: best.destEnd - 1 };
  }
  for (let step = 0; step < TRIM_STEPS; step += 1) {
    if (best.destEnd - best.destStart <= 1) break;
    const shorter = haystack.slice(best.destStart + 1, best.destEnd);
    const score = ratio(needle, shorter);
    if (score < best.score) break;
    best = { score, destStart: best.destStart + 1, destEnd: best.destEnd };
  }
  return best;
}

/** Similarity of the best window, from 0 to 100. */
export function partialRatio(a: string, b: string): number {
  return partialRatioAlignment(a, b)?.score ?? 0;
}
