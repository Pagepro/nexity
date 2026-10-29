# Contributing

Thanks for helping. This file covers how the repository is laid out, how to run each starter and what a pull request needs.

## Layout

The repository root is not a pnpm workspace and has no `package.json`. It holds two independent pnpm monorepos and the agent layer:

| Folder | What it is |
|---|---|
| `base/` | Unbranded starter (`@nexity/web`, `@nexity/studio`), no seed content |
| `theme-meridian/` | Meridian demo (`@meridian/web`, `@meridian/studio`) with seed content and product mocks |
| `.agents/` | Skills (`.agents/skills/<name>/SKILL.md`) and read-only agents (`.agents/agents/<name>.md`) for any coding agent; plain folders, no build step |
| `.claude/` | Two symlinks (`skills`, `agents`) to `.agents/`, so Claude Code loads the same files. Don't put files here |

Each starter has its own `package.json`, `pnpm-workspace.yaml` and `pnpm-lock.yaml`. Run every `pnpm` command from inside the starter folder, never from the root.

## Run a starter

Requirements: Node.js 22.12 or newer, pnpm 12 (`corepack enable` uses the version pinned in `packageManager`).

```bash
cd base            # or: cd theme-meridian
pnpm install
```

Create the env files from the templates and fill in a Sanity project id and dataset you own (never commit them, `*.local` and `.env` are git-ignored):

- `web/.env.local` from `web/.env.example`
- `studio/.env` from `studio/.env.example`

Then:

```bash
pnpm dev           # site on http://localhost:3000, Studio on /admin
pnpm seed          # theme-meridian only: imports the Meridian dataset
```

`base/` has no seed. On an empty dataset it shows a **Next steps** screen until Site settings, header, footer and homepage exist. Use a dataset you can throw away for testing, especially before `pnpm seed`, which replaces documents.

## Checks

Run these in each starter you changed. CI runs the same commands for both folders (`.github/workflows/ci.yml`):

```bash
pnpm lint          # oxlint + client-boundary check
pnpm format:check  # oxfmt (pnpm format to fix)
pnpm typecheck     # tsc in web/ and studio/
pnpm build         # Next.js production build (needs a reachable Sanity project)
```

If you change anything `sanity init` reads (`sanity.cli.*`, `sanity.config.*`, `.env.example`, `package.json`), also run the template validator from outside the repository:

```bash
cd /tmp && npx --yes -p @sanity/template-validator@3.1.1 sanity-template-validate <path-to-repo>/base
```

## Fixes go to both starters

`base/` and `theme-meridian/` are full, separate copies with the same features. A general fix (schemas, GROQ, preview, revalidation, SEO, a bug in a section) goes into **both** folders in the same pull request. Only changes that are about the look or content of one starter stay in one folder: Meridian design tokens, product mocks and seed content in `theme-meridian/`, neutral tokens in `base/`.

If a change cannot be ported (or should not be), say why in the pull request.

Keep the two independent: files inside one starter never name the other, because a project made from it never sees the other folder.

## Skills

Skills and agents live in `.agents/` and are Markdown (plus scripts in some skills). Keep the frontmatter (`name`, `description`), keep paths relative to a project made from a starter, and do not reference client projects or private URLs. Write them for any agent: no vendor-only wording, and when a step depends on one tool (slash commands, subagents), say what other agents do instead. Point to rules by file and heading (`docs/agents/new-section.md`, `web/AGENTS.md` → "GROQ Queries"), and keep each starter's root + `web/` `AGENTS.md` under 32 KiB together (Codex's limit).

Edit skills, agents and tooling only in the root `.agents/`. After a change,
run `node .agents/export.mjs`, `node .agents/export.mjs --check`,
`node --test .agents/tests/*.test.mjs` and
`node --test .agents/skills/*/scripts/*.test.mjs` (unit tests of skill scripts,
Node built-ins only). Commit the generated `.agents/` snapshots in both starters
with the source. The catalog records skill/agent
dependencies; each snapshot lock records its version and content hashes.

## Pull requests

- One topic per pull request. Fill in the template: which starter, whether the change was ported to the other one, a test plan.
- For visible changes, add before/after screenshots under `.github/pr-assets/<branch>/` in the same pull request and link them with a relative path.
- Never commit Sanity project ids, datasets, tokens or other secrets. Use env vars and `.env.example` placeholders.

## Reporting issues

Use the issue templates. Security issues go through [SECURITY.md](SECURITY.md), not public issues.
