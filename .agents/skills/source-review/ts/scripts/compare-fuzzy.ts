/**
 * Compare the fuzzy scores of this port against `rapidfuzz`.
 *
 * The numbers marked `py` come from the Python implementation. Run:
 *
 *     npx tsx scripts/compare-fuzzy.ts
 *
 * The port does not need the same score. It needs the same decision at the
 * threshold: 90 for the quote gate and 92 for the claim anchor. Read
 * `docs/PORT-CONTRACT.md` section 3.
 */

import { fold } from "../src/textops.js";
import { partialRatioAlignment } from "../src/fuzzy.js";

const page = fold(
  "Announcing TypeScript 5.5. This section was written by Dan Vanderkam, who implemented this feature. Many paragraphs of other text sit between the two passages. This works because TypeScript now infers a type predicate for the filter function.",
);
const art = fold(
  "Node.js 22 became the active long term support release in October 2024.\n The team reports that   the   adoption   rate reached 63% of new projects.\n We think the tooling is good.",
);

console.log("--- quote gate (python / node) ---");
const quotes: [string, number][] = [
  ["This section was written by Dan Vanderkam, who implemented this feature.", 100.0],
  ["This section was written by Dan Vanderkam who implemented this feature", 98.57],
  ["This section was writen by Dan Vanderkam, who implemented this featue.", 97.14],
  ["This section was written by Anna Nowak, who implemented this feature.", 88.41],
  ["infers a type predicate for the filter function", 100.0],
];
for (const [q, py] of quotes) {
  const a = partialRatioAlignment(fold(q), page);
  console.log(
    `  py=${py.toFixed(2).padStart(6)}  node=${(a?.score ?? 0).toFixed(2).padStart(6)}  win=[${a?.destStart},${a?.destEnd}) w=${(a?.destEnd ?? 0) - (a?.destStart ?? 0)}  ${q.slice(0, 44)}`,
  );
}

console.log("--- anchor (python / node) ---");
const claims: [string, number, number, number][] = [
  ["Node.js 22 became the active long-term support release in October 2024.", 98.59, 0, 71],
  ["Node.js 22 became the active long term support release in 2024.", 95.87, 0, 58],
  ["Node.js 22 finally became the active long term support release in October 2024.", 94.67, 0, 71],
  ["Node.js 22 became the activ long term suport release in October 2024.", 97.1, 0, 69],
  ["Node.js 18 became the maintenance release in September 2019 for new teams.", 62.59, 0, 73],
];
for (const [c, py, s, e] of claims) {
  const a = partialRatioAlignment(fold(c), art);
  console.log(
    `  py=${py.toFixed(2).padStart(6)} [${s},${e})   node=${(a?.score ?? 0).toFixed(2).padStart(6)} [${a?.destStart},${a?.destEnd})  ${c.slice(0, 40)}`,
  );
}
