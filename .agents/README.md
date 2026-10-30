# Agent skills and read-only agents

Skills and agents that know the conventions of Nexity projects. They are written for any
coding agent, not one vendor: skills use the open Agent Skills format
(`skills/<name>/SKILL.md` with `name` and `description` frontmatter), agents are plain
Markdown checklists (`agents/<name>.md`). Both read the project's `AGENTS.md`, `DESIGN.md`
and `BRAND.md`.

| Agent | Where it finds them |
|---|---|
| Codex | `.agents/skills/` directly; invoke a skill by name (`$create-section`) or describe the task |
| Claude Code | `.claude/skills/` and `.claude/agents/`, symlinks to this folder; skills run as slash commands (`/create-section`), agents as subagents |
| Others (Cursor, Gemini CLI, …) | Point the agent at `.agents/skills/<name>/SKILL.md`, or let it follow the pointer in `AGENTS.md` |

The `.claude/` symlinks are committed. Both starters also ship a generated agent
snapshot, so projects created from a starter have skills and agents immediately.
Edit the source here, then regenerate the snapshots; do not edit their copies.

## Skills

**Building a site**

| Skill | What it is for |
|---|---|
| `project-setup` | Step by step from `sanity init --template` or a clone to a running site and go-live: env files, tokens, blueprint, first content, rename, brand files, Vercel |
| `create-section` | A new page section end to end: first checks whether an existing section already covers it (reuse, extend or new), then builds it from `DESIGN.md` and `BRAND.md` through to a first instance in the Studio. Hands off to the agents below |
| `sanity-module-catalog` | Screenshots each section's Sections Gallery fixture into `web/public/admin/thumbnails/<type>.webp`, the tiles of the Studio insert menu's grid view, and reports missing ones; on request, also builds a gitignored screenshot catalog of a live site's sections (used vs unused) |
| `pr-writeup` | A PR description with a before/after table, screenshots and a test plan. Needs `work-humanizer` |
| `work-humanizer` | Edits AI-sounding text so it reads like a person wrote it. Third-party, MIT ([phuryn/work-humanizer](https://github.com/phuryn/work-humanizer)) |
| `product-mock` | Product mocks (HTML-rendered app screens). Only for `theme-meridian` |

**Maintaining a site** (content, links, data layer)

| Skill | What it is for |
|---|---|
| `link-fix` | Counts own-domain links, `http://` URLs and trailing/double-slash or slug issues in the dataset in one table, then fixes the rules the user picks (references or paths, https per host, the `next.config` slash convention) with a dry-run script, re-checks, and hands the code to `link-reviewer` |
| `generate-alts` | Lists every image with its context, caches one preview per asset in `.alts/`, proposes alts in the content language (or decorative), builds an HTML review page, and writes the approved alts to drafts with a dry-run script |
| `sanity-optimizations` | Runs three read-only auditors in parallel (queries and reads per route, images, CDN/caching/rendering), merges their findings into one ranked report, and estimates Sanity and Vercel usage for 100–5,000 visitors a day; fixes only what the user picks |

**For marketers** (any site and any CMS; only in this repository, not in the starters)

These read published pages, exports or pasted text and do not write to a CMS by default: they
find, review and propose, and a person makes the change. The one exception is opt-in:
`internal-links` can put approved links into Sanity drafts when the user asks and gives access. They are listed under `rootOnly` in
`catalog.json`, so the starter snapshots and projects made from them do not get them.

They are also published as the Claude Code plugin `marketing-skills` (`.claude-plugin/marketplace.json`
at the repository root lists their folders): `/plugin marketplace add Pagepro/nexity`, then
`/plugin install marketing-skills@nexity`. Other agents install them with
`npx skills add Pagepro/nexity`. A new marketing skill goes into `rootOnly` and into the
manifest's `skills` list. Their `SKILL.md` files refer to scripts relative to the skill's own
folder, never to `.agents/skills/…`, because an installed copy lives elsewhere.

| Skill | What it is for |
|---|---|
| `marketing-setup` | Setup for a marketer with no terminal experience, after the plugin, `npx skills` or a ZIP: picks the skills with them, finds where they were installed (repairs `.claude/skills` a ZIP turned into a file), says what to install click by click, builds `source-review`, runs a short test per skill and lists what to ask for. The person starts from [`MARKETING-SKILLS-README.md`](../MARKETING-SKILLS-README.md) |
| `source-review` | Extracts the claims of an article, searches and reads sources for each, and writes a report with a PASS, PASS_WITH_WARNINGS or BLOCKED verdict. A Node CLI in `ts/` (build once) |
| `brand-kit` | Builds a brand kit from a public URL: foundations, voice, audiences and the gaps to ask about. A starting point for a project's `BRAND.md` |
| `blog-post-quality-review` | A read-only editorial review: title fit, logic, every heading against its section, a technical and a marketing read, a weighted 0–10 scorecard and the three fixes that matter most |
| `internal-links` | Crawls a site (sitemap or URL list), reads each article's content, matches the pages an article names by their own titles plus any governed phrases, lets the agent pick and propose links from a shortlist, checks them against the article's link budget, and turns the links the user approves on an HTML review page into a list for the editor (or, on request, into Sanity drafts over the API or a Sanity MCP server); `verify` re-reads the live pages |
| `blog-post-update` | One published post, end to end: a snapshot from its URL, scope, a proportionate diagnosis from Search Console and GA4 (MCP, the script's own Google access, exports, or none), an audit of the article as published, an intervention that is often not a rewrite, named gates bound to file hashes, a Markdown edit, images rendered through the installed Chrome, checks, an HTML review page, and an approved change list for the editor; `verify` checks the live page. Needs `blog-post-quality-review`, `source-review` and `work-humanizer` |

## Agents

Read-only agents that encode the starter's conventions, so a check can be delegated (own
context, can run in parallel) instead of re-derived each time. Skills hand off to them by
name; `catalog.json` records which skill installs which agent.

- **Reviewers** check a change and return a verdict: the first four run at the phases of
  `/create-section`, `link-reviewer` after link-producing code changes and after `/link-fix`.
- **Auditors** look at the whole site for `/sanity-optimizations`, in parallel, and return
  findings plus numbers (reads per route, rendering per route, image counts).
- **`alt-text-writer`** is a worker, not a reviewer: `/generate-alts` runs one per batch of
  images, and it returns proposals JSON instead of a verdict.

| Agent | When it runs | What it does |
|---|---|---|
| `content-model-architect` | before writing schema for a new type, section or page, and to settle reuse vs extend vs new (`/create-section` Phase 0) | recommends the shape: inline vs document-backed listing vs shared section, cta vs link, rich-text variant, listing page vs catchall |
| `styling-fidelity-reviewer` | after drawing or restyling a component, or to compare it with a reference (`/create-section` Phase 2) | Tailwind v4 / token rules from `web/AGENTS.md` and `DESIGN.md`; compares with a reference screenshot or mockup when you pass one |
| `sanity-schema-reviewer` | after creating or editing a schema (`/create-section` Phase 3) | `studio/AGENTS.md` conventions: array references, `hotspot`, `section-options` first, radio over booleans, icon + preview, field groups, registration |
| `groq-parity-reviewer` | after a GROQ branch or section component change (`/create-section` Phase 4) | schema ↔ GROQ ↔ props parity, `buttonIcon` projection, the empty-`href` trap, sections missing from the insert menu or the map |
| `link-reviewer` | after adding or editing components, sections, GROQ, seeds/fixtures or config that produce links, after changing `trailingSlash` or the base URL, and after `/link-fix` | hardcoded `http://` and own-domain URLs, `<a>` vs `next/link`, rel/target on external links, hand-built hrefs, one trailing-slash convention across `resolveUrl`, sitemap, canonical/alternates, redirects, `llms.txt` and Markdown routes, links in seeds and fixtures |
| `sanity-query-auditor` | `/sanity-optimizations`, in parallel | GROQ projections and dereferences, Portable Text slices, query size (GET/POST), `defineQuery`, Sanity reads per route (layout, page, `generateMetadata`, sections), waterfalls, duplicate reads, React `cache` |
| `sanity-image-auditor` | `/sanity-optimizations`, in parallel | one transformer, no raw asset URLs (OG, CSS, feeds), `sizes` vs rendered width, variants and quality, crop/hotspot, LQIP, preload only on LCP, SVGs, asset bloat |
| `sanity-delivery-auditor` | `/sanity-optimizations`, in parallel | `useCdn`, tokens and perspective, Live/stega only in draft mode, static vs dynamic per route, cache tags and purge scope, webhook filter, machine-route caching, proxy cost, Studio out of the bundle |
| `alt-text-writer` | describe step of `/generate-alts`, one per batch, in parallel | looks at a batch of cached previews with their context and returns one alt per usage (or decorative) as proposals JSON; never writes |

## Distribution and maintenance

`catalog.json` declares the version, skill dependencies, agent dependencies and
optional project capabilities. Skills under `rootOnly` stay in this repository and are never
exported or installed. `tooling/` is the Node-only installer and doctor.
The source is this directory; `base/.agents/` and `theme-meridian/.agents/` are
generated, committed snapshots with per-file hashes in `install-lock.json`.
Product mocks are excluded when the target has no `tools/product-mocks` directory.
When you rename a skill, add `"old-name": "new-name"` to `renamed` so an update moves
projects to the new name; a skill dropped from the catalog is uninstalled on update
(its files are removed unless they were edited locally).

After editing the catalog, a skill, agent or tool, run from the repository root:

```bash
node .agents/export.mjs
node .agents/export.mjs --check
node --test .agents/tests/*.test.mjs
node --test .agents/skills/*/scripts/*.test.mjs
```

The last command runs the unit tests next to skill scripts (`sanity-module-catalog`,
`link-fix`, `generate-alts`, `internal-links`, `blog-post-update`); they use only Node
built-ins. `internal-links` and `blog-post-update` share `scripts/html.mjs` as two identical
copies (each skill stays self-contained); a test fails when they differ. `source-review` has its own suite: `npm install && npm test` in its `ts/` folder.

Commit both exported snapshots and their locks with the source change. Bump the
catalog version for a distributed release; content digests distinguish intermediate
revisions. The exporter refuses to overwrite customized snapshot files. Edit the
canonical source, never the generated copies. No network or package install is used.

From an extracted project, `pnpm agent:install` repairs client links;
`pnpm agent:update --source /path/to/this-checkout` updates the installed selection
after checking for local edits. Both support `--dry-run`. See each project's
`docs/guides/skills.md` for selection, conflict recovery and Windows details, and
`docs/guides/agent-tools.md` for doctor and optional MCP configuration.

Restart the agent after installation. Where named subagents are unavailable, the
skills walk the agent's checklist inline (`create-section`, `link-fix`,
`sanity-optimizations`) or write the alts themselves (`generate-alts`).

## Use

- **Automatically:** each agent's `description` says when to run it, so the agent delegates at the
  matching phase of `/create-section`, `/link-fix`, `/sanity-optimizations` or `/generate-alts`.
- **By hand:** "Use the `sanity-schema-reviewer` on `studio/src/sanity/schemaTypes/sections/foo.ts`."
- **Before a PR:** the reviewers are independent and read-only; run the ones that match the
  change together (`styling-fidelity-reviewer`, `sanity-schema-reviewer`,
  `groq-parity-reviewer`, `link-reviewer`).

## Conventions for editing an agent

The frontmatter below follows Claude Code's subagent format; other agents ignore it and read
the body.


- **Read-only is explicit:** keep `tools: Read, Grep, Glob, Bash`. Omitting `tools` inherits
  every tool, including Edit and Write. `disallowedTools: Agent` blocks nested spawning.
- **`model: inherit`.**
- **A subagent does not inherit the parent's context.** Each agent names the files and headings it reads
  first; the canonical rule stays in `AGENTS.md`, `web/AGENTS.md` or `studio/AGENTS.md`, so
  change it there and keep the checklist here in step.
- **Description = trigger** ("Use PROACTIVELY when/after …"); `<example>` blocks go in the body.
- **Output contract:** `Verdict` + `Findings` as `severity · file:line · rule · fix`; auditors
  add their numbers tables. `alt-text-writer` is the exception and returns only the proposals
  JSON its skill expects. No agent edits files.
