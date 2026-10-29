/**
 * Placeholder images for gallery fixtures, independent of the dataset. `<Img>` serves a
 * root-relative `<name>-<w>x<h>.<ext>` URL as-is and reads its size from the file name.
 * React-free and serializable (imported by scripts / the `sections.json` route).
 */
import type { ImageFragment } from "@/types/fragments";

// Each file is `web/public/placeholders/<shape>-<width>x<height>.svg`; add a shape by
// adding the file and its entry here.
const PLACEHOLDERS = {
  landscape: { width: 1600, height: 1000 },
  wide: { width: 2000, height: 900 },
  square: { width: 600, height: 600 },
  portrait: { width: 800, height: 1000 },
  photo: { width: 1600, height: 1200 },
  screen: { width: 1600, height: 900 },
  banner: { width: 2400, height: 800 },
  strip: { width: 2400, height: 400 },
  backdrop: { width: 2400, height: 1600 },
  "logo-a": { width: 120, height: 24 },
  "logo-b": { width: 96, height: 24 },
  "logo-c": { width: 140, height: 24 },
} as const;

export type PlaceholderShape = keyof typeof PLACEHOLDERS;

export const PLACEHOLDER_LOGOS = [
  "logo-a",
  "logo-b",
  "logo-c",
] as const satisfies readonly PlaceholderShape[];

const PLACEHOLDER_DIRECTORY = "/placeholders";

const buildFragment = (url: string, alt: string): ImageFragment => ({
  alt,
  role: null,
  // Lazy so gallery previews never request `priority`/`eager` images.
  loading: "lazy",
  image: {
    crop: null,
    hotspot: null,
    asset: { url, altText: alt },
  },
  responsive: null,
});

export const mockImage = (
  shape: PlaceholderShape,
  alt = "Placeholder image",
): ImageFragment => {
  const { width, height } = PLACEHOLDERS[shape];

  return buildFragment(`${PLACEHOLDER_DIRECTORY}/${shape}-${width}x${height}.svg`, alt);
};

/** Never hardcode this base (or a project id) in a fixture. */
export const CDN_BASE = `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}`;

/**
 * The asset must exist in the active dataset, so the preview breaks on any other
 * dataset: prefer {@link mockImage}.
 */
export const imageFromUrl = (url: string, alt = ""): ImageFragment =>
  buildFragment(url, alt);
