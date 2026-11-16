# Nexity

Nexity is an open source system for starting and growing AI-native websites on Next.js + Sanity.

It is for teams where every website change lands on a developer. Nexity gives coding agents (Claude Code, Codex, Cursor) the design system, the blocks and the Sanity schema, so marketing can build new sections with AI and a developer reviews the result before it goes live.

![A request to add a section goes to the create-section skill, which reads AGENTS.md, DESIGN.md and BRAND.md and builds the section; styling-fidelity-reviewer then checks it against DESIGN.md](assets/agent-layer.png)

Live demo: https://meridian.nexity.build

## Quick start

Requirements: Node.js 22.12 or newer, pnpm 12.15 (`corepack enable` picks it up), a Sanity account (the free plan works).

```bash
npm create sanity@latest -- --template Pagepro/nexity/base
cd <your project folder>
pnpm dev
```

The site runs on http://localhost:3000 and the Studio on http://localhost:3000/admin.

The project comes with the agent layer: skills and reviewers in `.agents/`, already linked for Claude Code and Codex. Check the setup with `pnpm agent:doctor`. To link Cursor, take a newer version of the skills or set them up by hand, see [Agent layer](#agent-layer).

## What makes Nexity different

Nexity gives a coding agent more than build instructions. It gives it the rules of your brand and reviewers that check its work.

- **`DESIGN.md`: how it looks.** Tokens, section anatomy, do's and don'ts, read by every skill that touches what a visitor sees.
- **`BRAND.md`: what it says.** Audience, voice, messaging.
- **`AGENTS.md`: how to build.** Architecture, commands, conventions and step-by-step checklists.
- **Read-only reviewers** in `.agents/agents/`: `styling-fidelity-reviewer` checks a section against `DESIGN.md`, `sanity-schema-reviewer` and `groq-parity-reviewer` check the schema and the queries. The `create-section` skill runs them.
- **Skills** for setting up a project, creating sections, fixing links, writing alt texts and auditing Sanity use.
- **Marketing skills** for any site and any CMS, read-only by default.

Details and install options: see [Agent layer](#agent-layer).

## What is in the repository

Nexity Base ([`base/`](base/)) is a pnpm monorepo with two packages:

- **`web/`**: the Next.js 16 app (App Router, Tailwind CSS 4, TypeScript), with the Sanity Studio embedded at `/admin`.
- **`studio/`**: a standalone Sanity Studio with the same schemas. Schemas live here and `web/` imports them.

This repository holds the starter, a demo site built on it (`theme-meridian/`) and, in `.agents/`, the agent layer that works with them: skills and read-only agents (reviewers, auditors) for any coding agent (Claude Code, Codex, Cursor and others).

## Stack

| | Version |
|---|---|
| Next.js | 16.4 (App Router, Turbopack) |
| React | 19.3 |
| Sanity Studio | 6.20 (`next-sanity` 13.3, `@sanity/client` 8.11) |
| Tailwind CSS | 4.3, with shadcn/ui |
| TypeScript | 7.0 |
| Zod | 4.6 |
| Oxlint / Oxfmt | 1.89 / 0.74 |
| c15t (cookie consent) | 3.1 (`@c15t/nextjs`) |
| Resend | 6.34 |
| Node.js | 22.12 or newer |
| pnpm | 12.15 |

Versions are the minimums in each starter's `package.json`; both starters use the same ones.

## Start here

| Entry | What you get | How to start |
|---|---|---|
| [`base/`](base/) | Unbranded foundation. Same features as Meridian, neutral look (default Tailwind palette, Inter). Starts on an empty dataset and shows a **Next steps** screen until you add the first content. | `npm create sanity@latest -- --template Pagepro/nexity/base` |
| [`theme-meridian/`](theme-meridian/) | Demo site for Meridian, a fictional B2B brand: full design, product mocks and seed content. | `npm create sanity@latest -- --template Pagepro/nexity/theme-meridian`, then `pnpm seed` |
| [`.agents/`](.agents/) | The agent layer: skills and read-only agents for setting up a project, creating sections, fixing links, writing alt texts and auditing Sanity use. | Already in every project made from a starter; `pnpm agent:doctor` checks it (see [Agent layer](#agent-layer)) |
| Marketing skills | Audits and content skills for any site and any CMS, read-only by default. | `/plugin marketplace add Pagepro/nexity`, then `/plugin install marketing-skills@nexity`. Start from [`MARKETING-SKILLS-README.md`](MARKETING-SKILLS-README.md) |

`sanity init` creates or picks a Sanity project and dataset, downloads the starter folder (the agent layer included), writes `web/.env.local` and `studio/.env` with the project id and dataset, creates the API tokens, adds the localhost CORS origins and installs the dependencies.

Locally, the standalone Studio at http://localhost:3333 (also started by `pnpm dev`) reloads faster than `/admin`. Production serves only the Studio embedded at `/admin`.

In `theme-meridian/`, run `pnpm seed` to import the Meridian dataset (pages, posts, case studies, images) into the dataset you picked. The seed replaces documents with the same IDs, so use a fresh dataset.

Each starter has its own `README.md` and `docs/` with setup details, environment variables and deployment notes.

## Screenshots

| `base` | `theme-meridian` |
|---|---|
| ![base starter homepage](assets/base-home.png) | ![Meridian demo homepage](assets/meridian-home.png) |
| ![base starter pricing page](assets/base-pricing.png) | ![Meridian demo pricing page](assets/meridian-pricing.png) |
| ![base starter blog listing](assets/base-blog.png) | ![Meridian demo blog listing](assets/meridian-blog.png) |

## Features

Both starters have the same features. They differ only in look and seed content. The full list for editors and marketers is in each starter's `docs/FEATURES.md`.

- **Page builder**: about two dozen ready-made blocks (hero, feature grids, bento grid, split sections, stats, pricing, comparison table, testimonials, FAQ, contact form, CTA, listings and more). Each block has shared options: visibility, light/dark theme, dividers and an anchor ID.
- **Content types**: pages, blog, case studies, podcast episodes, reusable libraries (authors, testimonials, integrations), shared sections, global sections injected across URL areas, header, footer and site settings.
- **Editing**: Studio at `/admin` on the same domain, click-to-edit visual preview, live draft preview, tag-based revalidation on publish (no rebuilds), and a Sections Gallery with sample content for every block.
- **Redirects and rewrites** managed in the CMS, live about two minutes after publishing, with patterns, query-string passthrough and loop protection.
- **SEO**: per-page title, description, share image, noindex/nofollow, canonical and hreflang; generated share images; XML sitemap; `robots.txt` with a single `IS_INDEXABLE` launch switch; schema.org JSON-LD; pre-launch GROQ checks for missing or out-of-range titles and descriptions (`docs/guides/before-release.md`).
- **Content for AI agents**: `llms.txt`, and every page as Markdown (add `.md` to any URL).
- **Site basics**: GDPR cookie consent (c15t), Google Tag Manager by env var, a contact form sent through Resend, image optimization through the Sanity CDN, a PWA manifest.
- **Infrastructure as code**: `sanity.blueprint.ts` sets up CORS origins and the revalidation webhook from env vars.
- **Tooling**: TypeScript, Sanity TypeGen, Zod-validated env vars, Oxlint and Oxfmt.
- **Agent layer**: `AGENTS.md` (how to build), `DESIGN.md` (how it looks) and `BRAND.md` (what it says) give any coding agent the project's rules, plus skills and read-only agents in `.agents/`. See [Agent layer](#agent-layer).

## Agent layer

Every coding agent working on a Nexity project reads the same files. Nothing in them is tied to one vendor.

| File | Role | Read by |
|---|---|---|
| `AGENTS.md` (root, `web/`, `studio/`) | How to build: architecture, commands, conventions, the step-by-step checklists | Codex, Cursor and most agents natively; Claude Code through `CLAUDE.md`, a one-line `@AGENTS.md` import |
| `DESIGN.md` | How it looks: tokens in the frontmatter, then section anatomy and do's and don'ts | Every skill that touches what a visitor sees, and `styling-fidelity-reviewer` |
| `BRAND.md` | What it says (a filled-in example in Meridian, a template in `base`): audience, voice, messaging, the invented world of names and numbers | `create-section`, `project-setup`, `generate-alts`, `product-mock` |
| `.agents/skills/<name>/SKILL.md` | Repeatable workflows (set up a project, create a section, fix links, write alts, audit Sanity use) in the open Agent Skills format | Codex from `.agents/skills/`; Claude Code from `.claude/skills/`, a symlink to it |
| `.agents/agents/<name>.md` | Read-only reviewers and auditors with a fixed checklist and output format | Claude Code as subagents (`.claude/agents/` symlink); any other agent reads the file and walks the checklist |

Each starter has its agent layer inside, and `sanity init --template` downloads it with the rest of the folder: `.agents/skills/`, `.agents/agents/`, the installer in `.agents/tooling/` and the `.claude/` symlinks. A new project has the skills and agents from the start; there is nothing to copy. This repository has the same symlinks, so Claude Code and Codex pick up the skills when you open it.

From the project root:

```bash
pnpm agent:doctor                                  # check Node, pnpm, env files, agent files and client links
pnpm agent:install                                 # repair missing .claude/ links
pnpm agent:install --clients claude,codex,cursor   # also link .cursor/skills
```

To take a newer version of the skills, or a skill added later, clone this repository at the version you want and pass it as the source. The installer only reads files from that checkout: it downloads nothing and runs no code from it.

```bash
git clone https://github.com/Pagepro/nexity ../nexity
pnpm agent:update --source ../nexity --dry-run                   # show what would change
pnpm agent:update --source ../nexity                             # update the installed skills and agents
pnpm agent:install --source ../nexity --skills <name>,<name>     # add skills, with the agents they need
```

`.agents/install-lock.json` records what was installed, and an update stops instead of overwriting a file you changed.

### Manual setup (alternative)

The skills and agents are plain files, not a plugin, so you can also copy them by hand. Use this in a project that has no `.agents/` (one not made from a starter), or when you want a single skill without the installer. Keep `.agents/` as the one copy and point Claude Code at it with two relative symlinks:

```bash
# without a clone: fetch one skill, or all agents
npx degit Pagepro/nexity/.agents/skills/create-section .agents/skills/create-section
npx degit Pagepro/nexity/.agents/agents .agents/agents

# from your project root, with this repository cloned next to it
mkdir -p .agents/skills .agents/agents

# copy a skill
cp -R ../nexity/.agents/skills/create-section .agents/skills/

# or symlink it, so it follows updates to the clone
ln -s "$(realpath ../nexity/.agents/skills/create-section)" .agents/skills/create-section

# agents used by the skills
cp ../nexity/.agents/agents/*.md .agents/agents/

# Claude Code reads .claude/; point it at the same files
mkdir -p .claude && ln -s ../.agents/skills .claude/skills && ln -s ../.agents/agents .claude/agents
```

A project made from a starter already has these folders and links, so skip this there: `degit` refuses a folder that is not empty, and `ln -s` puts a stray link inside the existing one. Pick one way per project: a file copied by hand is unknown to `.agents/install-lock.json` and can block the next `pnpm agent:update`.

What the agent layer holds:

- Building a site: `project-setup`, `create-section`, `sanity-module-catalog`, `pr-writeup`, `work-humanizer`, `product-mock`. `product-mock` works only in `theme-meridian`. `pr-writeup` needs `work-humanizer` next to it.
- Maintaining a site: `link-fix`, `generate-alts`, `sanity-optimizations`.
- For marketers, in this repository only (any site and any CMS, read-only by default, not in the starters): `brand-kit`, `site-contradictions`, `blog-post-quality-review`, `internal-links`, `blog-post-update` (needs `blog-post-quality-review`, `source-review` and `work-humanizer` next to it). They install as the Claude Code plugin `marketing-skills` (`/plugin marketplace add Pagepro/nexity`, then `/plugin install marketing-skills@nexity`) or with `npx skills add Pagepro/nexity`; `marketing-setup` then walks a marketer through the rest. Start from [`MARKETING-SKILLS-README.md`](MARKETING-SKILLS-README.md).
- Agents in `.agents/agents/`: the reviewers `content-model-architect`, `styling-fidelity-reviewer`, `sanity-schema-reviewer` and `groq-parity-reviewer` (run by `create-section`) and `link-reviewer` (run by `link-fix` and `create-section`); the auditors `sanity-query-auditor`, `sanity-image-auditor` and `sanity-delivery-auditor` (run by `sanity-optimizations`); and `alt-text-writer` (run by `generate-alts`).
- `work-humanizer` comes from [phuryn/work-humanizer](https://github.com/phuryn/work-humanizer) (MIT, license file kept in the skill folder).

[`.agents/README.md`](.agents/README.md) describes each skill and agent; `docs/guides/skills.md` in either starter covers installing them.

## Known limitations

- A project made from a starter is your own copy and does not update itself. By the time Nexity changes, you have made plenty of changes of your own (new sections, styles, content model), so a merge from this repository would conflict. To update, take the list of commits made here since you created the project and ask your coding agent to apply the ones you want to your code. The agent layer has its own command: `pnpm agent:update --source <checkout>` updates the skills and agents.
- Single-language site: the starters have no multi-language support.
- The newsletter signup is UI only: the form works, but the addresses are not stored or sent anywhere until you connect an email provider (Resend, Mailchimp, ConvertKit or another).
- Redirects and rewrites from the CMS go live about two minutes after publishing, not at once.
- Some skills need tools the installer does not install: a browser the agent can drive (Chrome) for `sanity-module-catalog` and for the screenshots in `pr-writeup`, Python with Pillow or ImageMagick for `pr-writeup`, and a Sanity token with write access for `link-fix` and `generate-alts`. Each `SKILL.md` lists what it needs.
- `product-mock` works only in `theme-meridian/`.
- The Meridian seed replaces documents with the same IDs, so use a fresh dataset.
- In production the Studio is served only at `/admin`; the standalone Studio on port 3333 is for local work.

## Docs and support

- Docs: [`base/docs/README.md`](base/docs/README.md) and [`theme-meridian/docs/README.md`](theme-meridian/docs/README.md)
- Bugs and questions: https://github.com/Pagepro/nexity/issues

## Contributing

Pull requests and issues are welcome. Start with:

- [CONTRIBUTING.md](CONTRIBUTING.md): how the repository is laid out, how to run a starter, the checks to run and what a pull request needs.
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md): how we treat each other here, and where to report a problem.
- [SECURITY.md](SECURITY.md): how to report a vulnerability in private. Don't open a public issue for it.

## License

[MIT](LICENSE) © 2026 Pagepro
