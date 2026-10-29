import assert from "node:assert/strict";
import test from "node:test";

import { bulletList, joinBlocks } from "./blocks.ts";

test("joinBlocks: a list right after a list switches bullets so the two stay separate", () => {
  const ctas = bulletList([
    "[Book a demo](https://example.com/demo)",
    "[Explore](https://example.com)",
  ]);
  const stats = bulletList(["**31%** shorter cycles", "**2×** attribution"]);
  const logos = bulletList(["Acme", "Globex"]);

  assert.equal(
    joinBlocks([ctas, stats, logos]),
    [
      "- [Book a demo](https://example.com/demo)\n- [Explore](https://example.com)",
      "* **31%** shorter cycles\n* **2×** attribution",
      "- Acme\n- Globex",
    ].join("\n\n"),
  );
});

test("joinBlocks: multi-line items and nested lists still end the list; other blocks reset it", () => {
  const items = bulletList(["[Post](https://example.com/p)\nMeta line\n- nested"]);

  assert.equal(joinBlocks([items, "- Next"]), `${items}\n\n* Next`);
  assert.equal(
    joinBlocks([items, "A paragraph.", "- Next"]),
    `${items}\n\nA paragraph.\n\n- Next`,
  );
  assert.equal(joinBlocks(["- a", "", null, false, "- b"]), "- a\n\n* b");
});

test("joinBlocks: only the lists a composite block opens with flip, not the ones further down", () => {
  // The page's remaining sections arrive as one block: a stats list, then more sections.
  const rest = joinBlocks(["- **31%** faster", "## Next section", "- Item"]);
  const twoLists = joinBlocks(["- a", "- b", "Paragraph", "- c"]);

  assert.equal(
    joinBlocks(["- [Demo](https://example.com)", rest]),
    "- [Demo](https://example.com)\n\n* **31%** faster\n\n## Next section\n\n- Item",
  );
  // Adjacent lists at the start flip together, so they stay apart from each other too.
  assert.equal(joinBlocks(["- x", twoLists]), "- x\n\n* a\n\n- b\n\nParagraph\n\n- c");
});
