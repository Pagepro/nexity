# Seed: the Meridian demo dataset

This folder holds `meridian.tar.gz`, an export of the Meridian demo dataset.
`pnpm seed` imports it into the dataset your site reads, so a fresh project looks
like the demo instead of showing the Next steps screen. The archive is committed
with the starter; if it is missing, `pnpm seed` stops with a message and you can
create the first content in the Studio instead (Site settings, header, footer and
the `/` page).

## What the archive contains

- Published documents only: no `drafts.*`, no system documents (`system.*`,
  `sanity.*` other than assets), no test documents.
- The image and file assets those documents use, with their original asset ids.
- The four placeholder images the Sections Gallery fixtures use
  (`PLACEHOLDER_ASSETS` in `web/src/ui/styleguide/sections-gallery/mock-image.ts`)
  and the assets the fixtures reference by hash through `imageFromUrl` (Hero,
  CTA banner, Feature grid, Newsletter, Split sections, Logos carousel). Without
  them the gallery cards for those sections show a render error or an empty image.
- Fictional content only. Meridian, its people, customers and numbers are
  invented (see `BRAND.md`); no real companies, people, emails or addresses.
- Size under 20 MB.

## Import it

```bash
pnpm seed                      # into NEXT_PUBLIC_SANITY_DATASET from web/.env.local
pnpm seed --dataset=develop    # into another dataset of the same project
```

The script (`web/scripts/seed.mjs`) reads `NEXT_PUBLIC_SANITY_PROJECT_ID` and
`NEXT_PUBLIC_SANITY_DATASET` from `web/.env.local` (then `web/.env`) and runs
`sanity dataset import seed/meridian.tar.gz <dataset> --replace`. It authenticates
with `SANITY_API_WRITE_TOKEN` (an Editor token, which `sanity init --template`
creates) when it is set, otherwise with your `sanity login` session. Revoke the
write token once the content is in.

`--replace` overwrites documents with the same `_id`. Documents you created
yourself under other ids are left alone.

## Recreate the archive

The export takes every asset in the dataset, used or not, as uploaded. Clean the
dataset first, or the archive grows with each round of edits:

- **Delete unused assets**: no document references them
  (`*[_type == "sanity.imageAsset" && count(*[references(^._id)]) == 0]`) and no
  fixture or `mock-image.ts` names their hash.
- **Replace oversized originals**: at most 2560 px on the long edge, photos as JPEG
  (quality ~80), images with transparency as palette PNG. A new file is a new asset
  id (`<sha1>-<w>x<h>.<ext>`), so upload it, point the documents at it, delete the
  old asset, and update the hash in any `gallery-fixture.ts` that uses it.

Then, from `web/` (or `studio/`) of a project whose dataset holds the demo content:

```bash
npx sanity dataset export <dataset> ../seed/meridian.tar.gz --no-drafts --overwrite
```

Check it before committing:

1. Unpack it to a temporary folder and remove `system.*` documents and any
   `sanity.*` documents that are not `sanity.imageAsset` / `sanity.fileAsset`,
   plus test documents. Pack it again (`tar -czf meridian.tar.gz <folder>`, keeping
   the folder layout the export wrote: `data.ndjson`, `assets.json`, `images/`, `files/`).
2. Grep `data.ndjson` for real company names, people, emails, phone numbers and
   street addresses. Legal pages copied from a real site (privacy policy, terms)
   are the usual leak: company name, registry numbers, address, representative.
3. Confirm every hash in `mock-image.ts` and the `gallery-fixture.ts` files has a
   file in `images/` (`ls images | grep <sha1>`); fixture-only assets are not in
   `data.ndjson`.
4. Keep it under 20 MB.
5. Import it into an empty dataset and compare the homepage and
   `/styleguide/sections` with the demo.
