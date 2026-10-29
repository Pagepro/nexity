import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TILE,
  TYPES_AWAITING_A_TILE,
  TYPES_WITHOUT_A_TILE,
  galleryPath,
  missingThumbnails,
  orphanThumbnails,
  sectionTypesFromSchemaSource,
  tilePlan,
} from "./lib.mjs";

const schemaSource = `
export const INNER_SECTIONS = [
  { type: "hero" },
  { type: "feature-grid" },
  { type: "comparison-table" },
];

export const SECTIONS = [...INNER_SECTIONS, { type: "shared-section-ref" }];
`;
const sectionTypes = sectionTypesFromSchemaSource(schemaSource);

describe("sectionTypesFromSchemaSource", () => {
  it("reads the INNER_SECTIONS list", () => {
    assert.deepEqual(sectionTypes, ["hero", "feature-grid", "comparison-table"]);
  });

  it("stops at INNER_SECTIONS, so the shared-section ref is not in the list", () => {
    assert.ok(!sectionTypes.includes("shared-section-ref"));
  });

  it("throws rather than returning an empty list when the file moves", () => {
    assert.throws(
      () => sectionTypesFromSchemaSource("export const OTHER = [];"),
      /INNER_SECTIONS/,
    );
    assert.throws(
      () => sectionTypesFromSchemaSource("export const INNER_SECTIONS = [\n];"),
      /empty/,
    );
  });
});

describe("tilePlan", () => {
  it("crops a tall section from the top", () => {
    const plan = tilePlan({ width: 1440, height: 2079 });
    assert.equal(plan.cropHeight, 1080);
    assert.equal(plan.cropped, true);
    assert.equal(plan.padded, false);
    assert.equal(plan.drawHeight, TILE.height);
  });

  it("pads a short band instead of stretching it", () => {
    const plan = tilePlan({ width: 1440, height: 266 });
    assert.equal(plan.cropHeight, 266);
    assert.equal(plan.cropped, false);
    assert.equal(plan.padded, true);
    // 266 * (800/1440) = 147.8 — a stretch to 600 would double the band's height.
    assert.equal(plan.drawHeight, 148);
    assert.ok(plan.drawHeight < TILE.height);
  });

  it("neither crops nor pads a section already at the tile ratio", () => {
    const plan = tilePlan({ width: 1440, height: 1080 });
    assert.equal(plan.cropped, false);
    assert.equal(plan.padded, false);
    assert.equal(plan.drawHeight, TILE.height);
  });

  it("rejects a zero-sized section", () => {
    assert.throws(() => tilePlan({ width: 1440, height: 0 }), /bad section size/);
  });
});

describe("missingThumbnails", () => {
  it("names a type with no file", () => {
    assert.deepEqual(missingThumbnails(["hero", "faq"], ["hero.webp"]), ["faq"]);
  });

  it("does not ask for a tile a type has no look for", () => {
    const types = ["hero", ...Object.keys(TYPES_WITHOUT_A_TILE)];
    assert.deepEqual(missingThumbnails(types, ["hero.webp"]), []);
  });

  it("ignores files that are not tiles", () => {
    assert.deepEqual(missingThumbnails(["hero"], ["hero.png", "README.md"]), ["hero"]);
  });
});

describe("TYPES_AWAITING_A_TILE", () => {
  it("exempts a type from the missing list without a file", () => {
    const types = ["hero", ...Object.keys(TYPES_AWAITING_A_TILE)];
    assert.deepEqual(missingThumbnails(types, ["hero.webp"]), []);
  });
});

describe("orphanThumbnails", () => {
  it("names a tile no section type claims", () => {
    assert.deepEqual(orphanThumbnails(["hero"], ["hero.webp", "text-banner.webp"]), [
      "text-banner",
    ]);
  });
});

describe("galleryPath", () => {
  it("points at the Sections Gallery detail page", () => {
    assert.equal(galleryPath("hero"), "/styleguide/sections/hero");
  });
});
