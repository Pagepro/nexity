# AGENTS.md

Project-level instructions for any AI coding agent (Codex, Claude Code, Cursor and others). Agents that look for another file name get a pointer to this one (`CLAUDE.md` is a one-line `@AGENTS.md` import). Detailed rules live in package-specific files:

| File | What to find there |
|---|---|
| [`BRAND.md`](BRAND.md) | **What the site says**: who the company is, audience, voice and tone, messaging, product facts, the names and numbers copy may use, what must never be invented. Ships as an unfilled template (first line `brand-template`); until it is filled in, write obviously placeholder copy. Read with `DESIGN.md` before any section or page work |
| [`DESIGN.md`](DESIGN.md) | **The visual contract. Read before building anything a visitor sees**: tokens (colors, type, radius, spacing) in the frontmatter, then how to use them — section anatomy, buttons, cards, dark bands, do's and don'ts. Ships with neutral defaults (Tailwind `neutral`, Inter); replace it with your design system. An approved design file wins over it; it wins over mockups and screenshots |
| [`web/AGENTS.md`](web/AGENTS.md) | React/Next.js 16 patterns, section components, Tailwind v4 styling, GROQ queries, images/links, RichText typography, CTA rendering, color inversion |
| [`studio/AGENTS.md`](studio/AGENTS.md) | Sanity schema rules, field conventions, section schema template, CTA vs link type, rich text type selection, content modelling, ndjson import |
| [`docs/agents/`](docs/agents/) | The full checklists and rules this file and `web/AGENTS.md` summarise: new section, new document type and listing pages, content patterns, template setup, dependency constraints, styling, RichText, images and links, client code. Each summary below links its file; open it before doing that task |
| [`docs/README.md`](docs/README.md) | What this starter is, how to get it running, and an index of the guides below |
| [`docs/FEATURES.md`](docs/FEATURES.md) | Editor/marketer-facing feature inventory: content types, page-builder sections, SEO, integrations |
| [`docs/guides/sanity-blueprints.md`](docs/guides/sanity-blueprints.md) | CORS origins + revalidate webhook as code (root `sanity.blueprint.ts`): env, first run, plan/deploy, moving off hand-made resources |
| [`docs/guides/markdown-for-agents.md`](docs/guides/markdown-for-agents.md) | Markdown for AI agents: `/x.md` and `Accept: text/markdown` → `proxy.ts` → `/api/markdown`, the per-section serializers (`SECTION_MARKDOWN_SERIALIZERS`), the Portable Text serializer, `llms.txt`, the "Copy as Markdown" button, headers and caching, how to test with curl |
| [`docs/guides/before-release.md`](docs/guides/before-release.md) | Pre-launch checklist — brand assets, llms.txt, sitemap/robots, `IS_INDEXABLE`, SEO field query, JSON-LD validation, placeholder sweep, nav active state, Sanity CORS, consent, GTM, stale CSS, PageSpeed/Lighthouse |
| [`CONCEPTS.md`](CONCEPTS.md) | Shared domain vocabulary (entities, named processes, status concepts) — read when orienting to the codebase or discussing domain concepts |

## Agent layer: context, skills, reviewers

Three files are the project's source of truth for every agent and every skill: this file
and its `web/`/`studio/` siblings (how to build), `DESIGN.md` (how it looks) and `BRAND.md`
(what it says; a template here until the project fills it). Read `DESIGN.md` and `BRAND.md` before any work a visitor will see, and
treat what they say as binding over your own defaults.

Repeatable workflows live as skills in `.agents/skills/<name>/SKILL.md`, and read-only
reviewers in `.agents/agents/<name>.md` (bundled with this project, see
[`docs/guides/skills.md`](docs/guides/skills.md)). When a task matches a skill, follow the
skill instead of improvising: first setup → `project-setup`, a new section →
`create-section`, a visual change → `sanity-module-catalog`, links → `link-fix`, alt texts
→ `generate-alts`, Sanity speed or cost → `sanity-optimizations`; before launch, walk
`docs/guides/before-release.md`. These docs write a skill call as `/name` (Claude Code);
in Codex it is `$name`, and any other agent opens the `SKILL.md` and follows it. An agent
without named subagents reads the reviewer's `.md` and walks its checklist itself.

Keep this file and `web/AGENTS.md` short: Codex reads at most 32 KiB of `AGENTS.md` per
directory chain (root + package together) and drops the rest. A long checklist goes in
`docs/agents/` with a two-line summary and a link here.

## ⚠️ This repo is a TEMPLATE — rename it as a next step after init

This starter runs under a placeholder name (`Nexity`, npm scope `@nexity`). **Offer the rename once the site runs**, before project-specific features, and ask for the project name if it isn't given. Rename the package scope first (root, `web/` and `studio/` `package.json` plus web's `@nexity/studio` dependency in lockstep, then `pnpm install` and `pnpm typecheck`), then the display name. Project IDs are env-driven, never hardcoded. Never hand-edit `web/public/admin/static/*`; regenerate it.

**Read [`docs/agents/template-setup.md`](docs/agents/template-setup.md) before the rename or any setup work**: the full file list, first content, keeping the template installable, linking the Sanity blueprint.

## Workspace Structure

This is a **pnpm workspace monorepo** with two packages:

- **`web/`** — Next.js 16 application with embedded Sanity Studio at `/admin`
- **`studio/`** — Standalone Sanity Studio (same schemas, for editors)

Schema types live in `studio/` and are imported by `web/` via `@nexity/studio` workspace dep.

## Commands

```bash
# Root (affects all packages)
pnpm dev              # Start both web and studio in parallel
pnpm dev:web          # Start Next.js web app only
pnpm dev:studio       # Start standalone Sanity Studio only
pnpm build            # Build the Next.js web app
pnpm lint             # Oxlint (repo-wide) + check:client; pnpm lint:fix to auto-fix
pnpm check:client     # Client boundary check: no RichText/FeatureIcon/@sanity/client in client code, sections import ./client-lazy
pnpm lint:strict      # Oxlint with type-aware rules (slower; needs oxlint-tsgolint)
pnpm format           # Format with Oxfmt (repo-wide); pnpm format:check to verify
pnpm typecheck        # TypeScript type check in all packages
pnpm agent:install    # Repair client links; --source <checkout> to install skills
pnpm agent:update     # Update with --source <checkout>; preserves local edits
pnpm agent:doctor     # Read-only setup diagnostics; --json for agents
pnpm blueprints:plan  # Diff sanity.blueprint.ts (CORS + revalidate webhook) against the live project
pnpm blueprints:deploy # Apply it (plan first). Setup: docs/guides/sanity-blueprints.md

# Web-specific (run from repo root or web/)
pnpm --filter @nexity/web ts:typegen      # Regenerate Sanity TypeScript types
pnpm --filter @nexity/web envs:validate   # Validate environment variables

# Studio-specific
pnpm --filter @nexity/studio deploy       # Deploy standalone studio
```

**Always use `pnpm`** — never `npm` or `yarn`.

## Pull Requests

Write PR descriptions (and any other text people will read, such as release notes)
in plain language: say what changed and why, keep every fact, commitment and
caveat, and skip filler. If you have the `work-humanizer` skill installed (MIT,
from [phuryn/work-humanizer](https://github.com/phuryn/work-humanizer)), run it on
the body before `gh pr create` / `gh pr edit`.

Keep the PR genre: `## Summary`, a decision/notes section only when the reviewer
needs one, and `## Test plan`.

## Dependency & Upgrade Constraints

- **Sanity 6.x:** the `@sanity/ui@4` / `@sanity/icons@5` removals are typed `never`, so `tsc` passes and only `next build` fails. After any Sanity bump run `pnpm ts:typegen`, `pnpm typecheck` **and** `pnpm build`.
- **`@c15t/nextjs`:** consent UI lives only in `web/src/ui/cookie-consent/consent-manager.tsx` (v3, `offline()` mode, no backend). Third-party tags (GTM) load through its `scripts`, never as a separate snippet.
- **`pnpm-workspace.yaml` `overrides`** pin patched transitive deps. Don't remove them.

**Read [`docs/agents/dependency-constraints.md`](docs/agents/dependency-constraints.md) before touching these dependencies.**

## Architecture Overview

### Route Groups (`web/src/app/`)

- `(frontend)/` — Public-facing Next.js routes; catchall `[[...slug]]/page.tsx` handles all CMS-driven pages
- `(studio)/admin/` — Embedded Sanity Studio at `/admin` (via `next-sanity/studio`)
- `api/` — API routes: `draft-mode/enable|disable`, `revalidate`, `revalidate-all`, `og`, `redirects`, `markdown` (the `/x.md` twins, see `docs/guides/markdown-for-agents.md`)

### Type System (`web/src/types/`)

- `sanity.types.ts` — **Auto-generated; never edit manually.** Run `pnpm --filter @nexity/web ts:typegen` to regenerate.
- `fragments.ts` — Type aliases for reusable fragment types (`ImageFragment`, `LinkFragment`, etc.)
- `sections.ts` — `ExtractSectionProps<"section-name">` utility for section component typing

### UI Layer (`web/src/ui/`)

- `components/` — Reusable primitives: `Image`, `BaseLink`, `Button`, `Icon`, etc.
- `sections/` — One directory per section type; registered in `sections/index.tsx` via `SECTION_MAP`. Complex sections use modular file structure.
- `header/`, `footer/`, `RichText/` — Layout components

## General Coding Conventions

### Code design (applies to every change)

- **The look comes from `DESIGN.md`, the words from `BRAND.md`.** Any change a visitor sees (a new or restyled section, a token, font, spacing or colour change, new copy, a fixture) starts from them: tokens and visual rules from `DESIGN.md`, copy, names and numbers from `BRAND.md`. When a request conflicts with them, follow the file and raise the conflict; when the design itself changes, update `DESIGN.md` in the same change.
- **Search before you write.** Before a new component, hook or helper, look for one that already does it: `web/src/ui/components/` (Image, BaseLink, ButtonLink, Icon…), `web/src/components/ui/` (carousel, hover-card), `web/src/lib/` (hooks such as `useLoadOnIntent`, `useIsNearViewport`; `resolveUrl`, `cn`), `web/src/ui/listing/` (paginated grids), then sibling sections. `git grep -n "<concept>"` takes seconds. Extend an existing piece (a prop, a variant) before copying it; two near-identical components drift apart.
- **Small, single-purpose files.** One component per file, kebab-case; pure logic in `utils.ts`, config in `constants.ts`, types in `types.ts`. A section that grows state or several visual parts gets split (`web/AGENTS.md` → "Section Component Structure"). If a file needs a comment to explain where its parts begin, split it.
- **No comments that restate the code.** Names and types say what code does. Comment only a workaround (a library, browser or platform quirk; link the issue or version), a non-obvious constraint that breaks something when ignored, or the place a project swaps a setting (e.g. the GTM ID). One or two lines; no section dividers, history or commented-out code.
- **Server first, client at the leaves.** Render on the server by default; `"use client"` only for the interactive piece, loaded where it's needed. The rules and patterns are in `web/AGENTS.md` → "Client Code & Performance", and `pnpm lint` enforces the mechanical ones (`pnpm check:client`).
- **Performance claims are measured.** Compare JS per page and main-thread work against `main` before calling a change an improvement (Lighthouse mobile, median of three runs), and put the numbers in the PR, including what didn't work.
- **A visual change refreshes the insert-menu tiles.** Every section type has a tile in the Studio's "Add item…" grid, `web/public/admin/thumbnails/<type>.webp`, a screenshot of its Sections Gallery fixture. After a new section, a restyle of a section, or a change to `DESIGN.md` tokens, fonts or `app.css` that every section picks up, recapture the affected tiles with the `sanity-module-catalog` skill (`/sanity-module-catalog`, or `node .agents/skills/sanity-module-catalog/scripts/capture.mjs --project=. --only=<type>` with `pnpm dev` running; drop `--only` after a token change) and commit the `.webp` files with the change. A missing tile fails nothing: the menu just shows an icon nobody recognises.
- **A fixed mistake becomes a rule.** When a bug or regression could happen again, add the rule where the next person will read it (this file, `web/AGENTS.md`, `studio/AGENTS.md`) and, if it can be checked mechanically, a check (`check:client`, the `satisfies` registries).

### File Naming

All files use **kebab-case**: `my-component.tsx`, `api-utils.ts`. React components use `.tsx`, utilities use `.ts`.

### Naming

- Never use shorthand variable names (`v`, `i`, `k`, `e`) — always use descriptive words (`cleanVariant`, `index`, `key`, `error`)
- Use `camelCase` for functions and variables
- Use `SCREAMING_SNAKE_CASE` for constants
- Use `PascalCase` for class/component names
- Prefix event handlers with `handle` (`handleClick`, `handleSubmit`)
- Use descriptive names with auxiliary verbs (`isLoading`, `hasError`)

### TypeScript

- Prefer interfaces over types; avoid enums — use const maps instead
- Use `satisfies` operator for type validation

### HTML & Accessibility

- Keep HTML flat — implement `tabindex`, `aria-label`, keyboard handlers and a visible focus state
- Use `rem` over `px`; avoid inline styles

### Adding New Environment Variables

Add validation in `web/src/setup/envVariables.ts` whenever a new env var is introduced.

## New Document Types (full workflow)

A new document type touches about ten places: schema, registration, Studio structure, presentation, route, sitemap, `resolveUrl` + link projections (when its URL isn't `metadata.slug`, or links render an **empty `href`**), structured data, Markdown + `llms.txt`, and `docs/FEATURES.md`.

**Follow the checklist in [`docs/agents/new-document-type.md`](docs/agents/new-document-type.md).**

## Listing Page Pattern (listing + detail pages)

A listing + detail feature (blog, case studies) **always gets a dedicated route, never the catchall**, and reuses the generic grid in `web/src/ui/listing/` instead of copying a sibling's plumbing. The `title` and `slug` of every routed document live in `metadata`, never top-level. Publish the listing singleton before building, or the build fails with "Missing Site settings".

**Follow the checklist and the content model conventions in [`docs/agents/new-document-type.md`](docs/agents/new-document-type.md).**

## Global Sections Helper

Never copy the global-section GROQ: a route calls `fetchGlobalSections(fullPath)` (`"/"`, `"blog/my-post"`) in its `Promise.all` and renders `before`/`after` around its own content. Details: [`docs/agents/content-patterns.md`](docs/agents/content-patterns.md).

## Shared Sections

`shared-section` (document) holds **inner** sections; `shared-section-ref` (section) references it. `INNER_SECTIONS` vs `SECTIONS` in `fragments/sections.ts` keeps them from nesting; `SECTIONS_QUERY` reuses `SECTION_BRANCHES_QUERY`, never duplicated. Details: [`docs/agents/content-patterns.md`](docs/agents/content-patterns.md).

## Document-Backed Listing Section (reusable entities referenced by a section)

Items that are reusable entities (testimonials, team members) are **documents**, and the section holds an **array of references** to them, keyed by `_id` after `->`. Inline objects only for content that belongs to one section instance. Details: [`docs/agents/content-patterns.md`](docs/agents/content-patterns.md).

## Creating a New Section (full workflow)

Read `DESIGN.md` (the look) and `BRAND.md` (the copy) first. **Run the checklist in [`docs/agents/new-section.md`](docs/agents/new-section.md) top to bottom** (the `create-section` skill does). Several misses fail silently:

- Register the type in `schemaTypes/index.ts` **and** `fragments/sections.ts`, or it never appears in the insert menu.
- Restart the Studio and the web dev server before editing a document that uses it; a stale Studio strips it on save.
- Gallery fixture, JSON-LD contributor and Markdown serializer: `pnpm typecheck` fails until all three exist.
- Capture the insert-menu tile and update `docs/FEATURES.md`; nothing fails if you skip them.

