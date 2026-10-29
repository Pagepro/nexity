/**
 * Placeholder images for gallery fixtures. `<Img>` throws unless it gets a real Sanity
 * asset, so fixtures reference placeholder assets shipped in the demo dataset
 * (`seed/meridian.tar.gz`). "Image asset is missing" in the gallery → run `pnpm seed`.
 * React-free and serializable (imported by scripts / the `sections.json` route).
 */
import type { ImageFragment } from "@/types/fragments";

/**
 * Uploads are content-addressed, so these ids are the same in every dataset the
 * archive is imported into. Keep these assets when re-exporting the archive.
 */
const PLACEHOLDER_ASSETS = {
  landscape: {
    assetId: "image-1934aba8c494a798f109476c9e9d5b135e389636-1600x1000-jpg",
    width: 1600,
    height: 1000,
  },
  wide: {
    assetId: "image-a5c1d072079dc09f5a0db39c00650f8d0a0ba5ee-2000x900-jpg",
    width: 2000,
    height: 900,
  },
  square: {
    assetId: "image-5e68a3ef7e037d7c3b56453209f0d068e854f447-600x600-jpg",
    width: 600,
    height: 600,
  },
  portrait: {
    assetId: "image-3fee9b3dba316dee716fc83dc77519b7fd8a07a2-800x1000-jpg",
    width: 800,
    height: 1000,
  },
} as const;

export type PlaceholderAssetId = keyof typeof PLACEHOLDER_ASSETS;

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;

/** Never hardcode this base (or a project id) in a fixture. */
export const CDN_BASE = `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}`;

const assetIdToUrl = (assetId: string): string => {
  const withoutPrefix = assetId.replace(/^image-/, "");
  const lastDash = withoutPrefix.lastIndexOf("-");
  const path = withoutPrefix.slice(0, lastDash);
  const extension = withoutPrefix.slice(lastDash + 1);
  return `${CDN_BASE}/${path}.${extension}`;
};

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
  assetId: PlaceholderAssetId,
  alt = "Placeholder image",
): ImageFragment => buildFragment(assetIdToUrl(PLACEHOLDER_ASSETS[assetId].assetId), alt);

/**
 * The URL must point at an asset in the active dataset (the ones the fixtures use
 * ship in `seed/meridian.tar.gz`).
 */
export const imageFromUrl = (url: string, alt = ""): ImageFragment =>
  buildFragment(url, alt);
