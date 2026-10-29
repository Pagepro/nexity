# Template setup and rename

What to change first in a project made from this starter. Indexed from [`AGENTS.md`](../../AGENTS.md); the short version of each rule is there, the full one is here.

## ⚠️ This repo is a TEMPLATE — rename it as a next step after init

This codebase is a **starter template**. The reference build used the placeholder
name **`Meridian`** (display string) and the **`@meridian`** npm scope. A project
created with `sanity init --template`, the Deploy with Vercel button or a hand clone
**runs under these names**, so the rename never blocks setup. **Offer it as a next
step once the site runs** (README → "Next steps after init"), and do it before
building project-specific features. Ask the user for the
project name if it isn't given.

Two distinct things to rename — do them in this order:

1. **Package scope `@meridian` → `@<project>`** (kebab-case). Touches: `package.json`
   (root, and the `name` of `web/` + `studio/` **and** web's `@meridian/studio`
   dependency — keep all three in lockstep or `pnpm install` breaks), every
   `pnpm --filter @meridian/web …` command, and references in `web/AGENTS.md`,
   `studio/AGENTS.md`, `README.md` and `.oxfmtrc.json`.
   Then run `pnpm install` (relinks the workspace) and `pnpm typecheck`.
2. **Display name `Meridian` → `<Project Display Name>`** (brand string). Touches
   content/code: `studio/src/sanity/lib/seo-title.ts`
   (`FALLBACK_SITE_TITLE`, the default `<title>`), `web/src/app/manifest.ts`, `web/src/ui/footer/*`, the
   `web/src/ui/styleguide/*` sample copy, schema example defaults
   (`studio/.../sections/{hero,faq}.ts`, `.../richText/blocks/callout.ts`,
   `documents/post.ts`), and gallery fixtures.

Also on setup (not a rename, but "change first"):

- **Sanity project** — set `SANITY_STUDIO_PROJECT_ID`, `NEXT_PUBLIC_SANITY_PROJECT_ID`
  and dataset in `studio/.env` / `web/.env` (or `web/.env.local`, which `sanity init`
  writes and every script reads) to the new project's values. Project IDs are
  **env-driven, never hardcoded** — no code edit needed.
- **First content** — on an empty dataset every route shows the Next steps screen
  (`web/src/ui/getting-started/`, gated by `getSetupStatus()` in the frontend layout).
  `pnpm seed` imports the Meridian demo dataset (`seed/meridian.tar.gz`, see
  `seed/README.md`) with `sanity dataset import --replace`: demo documents with the
  same `_id` are overwritten, others stay.
- **Keep it installable** — `.github/workflows/validate-template.yml` runs Sanity's
  template validator (the check `sanity init --template` runs). Every workspace package
  with a Sanity dependency needs `sanity.config` + `sanity.cli` and an `.env.example`
  naming the project id and dataset. A new required env var breaks the "boots after
  init" promise: prefer an optional one with a fallback, and list a recommended one in
  `web/src/setup/env-recommendations.ts` so the Next steps screen and `envs:validate`
  surface it.
- **Link the Sanity blueprint** (root `sanity.blueprint.ts`, CORS + revalidate
  webhook) to the new project: `sanity blueprints init . --project-id <id> --stack-name production`
  from the repo root, then `pnpm blueprints:plan` / `pnpm blueprints:deploy`. Set
  `SANITY_BLUEPRINT_SITE_URL` once the domain is known. See
  [`docs/guides/sanity-blueprints.md`](../guides/sanity-blueprints.md).
- **Regenerate `web/public/admin/static/*`** (the Sanity "Create" manifest/schema
  artifacts) via `pnpm --filter @meridian/web manifest` (or a build) — they still
  embed the old name/projectId until regenerated. **Never hand-edit them.**
- Review **`CONCEPTS.md`** and reset any domain vocabulary that was specific to the
  reference build.

> Sanity check after renaming: `git grep -in "meridian"` should return only
> regenerated artifacts you haven't rebuilt yet.
