export const TILE = { width: 800, height: 600 };

// The gallery is gated to Studio editors outside `next dev`, so capture from a local dev server.
export const galleryPath = (type) => `/styleguide/sections/${type}`;

export const TYPES_WITHOUT_A_TILE = {
  "shared-section-ref": "renders a referenced bundle — it has no look of its own",
};

// Tiles owed, not exempt: `--report` still fails on them. Delete the entry once the tile is captured.
export const TYPES_AWAITING_A_TILE = {};

// Parses the .ts source (this .mjs cannot import it); a copied list here would drift.
export function sectionTypesFromSchemaSource(source) {
  const start = source.indexOf("export const INNER_SECTIONS");
  if (start === -1) {
    throw new Error("INNER_SECTIONS not found — did fragments/sections.ts move?");
  }
  const end = source.indexOf("];", start);
  if (end === -1) throw new Error("INNER_SECTIONS array is not closed");
  const types = [
    ...source.slice(start, end).matchAll(/\{\s*type:\s*"([^"]+)"\s*\}/g),
  ].map((match) => match[1]);
  if (types.length === 0) throw new Error("INNER_SECTIONS parsed as empty");
  return types;
}

export function missingThumbnails(allTypes, capturedFiles) {
  const present = new Set(
    capturedFiles
      .filter((file) => file.endsWith(".webp"))
      .map((file) => file.slice(0, -5)),
  );
  return allTypes.filter(
    (type) =>
      !present.has(type) &&
      !(type in TYPES_WITHOUT_A_TILE) &&
      !(type in TYPES_AWAITING_A_TILE),
  );
}

export function orphanThumbnails(allTypes, capturedFiles) {
  const known = new Set(allTypes);
  return capturedFiles
    .filter((file) => file.endsWith(".webp"))
    .map((file) => file.slice(0, -5))
    .filter((name) => !known.has(name));
}

export function tilePlan({ width, height }) {
  if (!(width > 0) || !(height > 0))
    throw new Error(`bad section size ${width}x${height}`);
  const maxHeight = Math.round((width * TILE.height) / TILE.width);
  const cropHeight = Math.min(height, maxHeight);
  const scale = TILE.width / width;
  return {
    cropHeight,
    scale,
    drawHeight: Math.max(1, Math.round(cropHeight * scale)),
    cropped: cropHeight < height,
    padded: cropHeight < maxHeight,
  };
}
