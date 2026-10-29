# Documentation

This folder documents the starter: a Next.js 16 site with an embedded Sanity Studio
(`web/`) and a standalone Studio (`studio/`), in one pnpm workspace. It comes with a
page builder of ready-made sections, listing and detail pages (blog, case studies,
podcast), visual editing, tag-based revalidation, request-time redirects, SEO and
JSON-LD, `llms.txt` and a Markdown version of every page.

## Getting started

1. Create the project: `sanity init --template`, the Deploy with Vercel button, or a
   hand clone. The root [`README.md`](../README.md) → "Installation" walks through all
   three.
2. Fill `web/.env` (or `web/.env.local`) and `studio/.env` with your Sanity project id,
   dataset and tokens. `pnpm --filter @meridian/web envs:validate` tells you what is
   missing.
3. Run `pnpm dev`. On an empty dataset every route shows a **Next steps** screen until
   Site settings, the header, the footer and the `/` page exist; `pnpm seed` imports
   the Meridian demo dataset (`seed/meridian.tar.gz`, see [`seed/README.md`](../seed/README.md)).
4. Rename the template (`@meridian` scope and the `Meridian` display name):
   [`agents/template-setup.md`](./agents/template-setup.md).
5. Before launch, link the Sanity blueprint and work through the pre-launch checklist
   (guides below).

## Feature overview

- **[FEATURES.md](./FEATURES.md)**: what the platform offers, written for content
  editors, marketers and CMOs: page-builder blocks, content types, editing experience,
  SEO/AEO (incl. `llms.txt`), and known pre-launch gaps.

## Guides

- **[guides/sanity-blueprints.md](./guides/sanity-blueprints.md)**: CORS origins and
  the revalidate webhook as code (root `sanity.blueprint.ts`): env, first run,
  plan/deploy, moving off hand-made resources.
- **[guides/before-release.md](./guides/before-release.md)**: pre-launch checklist:
  what to check on the deployed site, the exact command for each check, and what
  "good" looks like.
- **[guides/markdown-for-agents.md](./guides/markdown-for-agents.md)**: the Markdown
  twin of every page (`/x.md`, `Accept: text/markdown`), the per-section serializers,
  `llms.txt`, headers and caching, how to test it with curl.
- **[guides/skills.md](./guides/skills.md)**: the agent skills and reviewer agents from
  the project's `.agents/` folder: install/update commands and client adapters.
- **[guides/agent-tools.md](./guides/agent-tools.md)**: setup diagnostics and optional Next.js/Sanity MCP connections.

## Project guidelines

- **[BRAND.md](../BRAND.md)**: who the brand is and what the site says: audience,
  positioning, voice, messaging, the invented world of names and numbers, what must
  never be presented as real.
- **[DESIGN.md](../DESIGN.md)**: the visual contract: design tokens in the
  frontmatter, then how to apply them. Read before building anything a visitor sees.
- **[CONCEPTS.md](../CONCEPTS.md)**: shared domain vocabulary.
- **[AGENTS.md](../AGENTS.md)**: architecture, commands, coding conventions, and short
  versions of the workflow checklists.
- **[agents/](./agents/)**: the full checklists and rules AGENTS.md links (new section,
  new document type, listing pages, styling, RichText, client code).
- **[web/AGENTS.md](../web/AGENTS.md)**: React/Next.js patterns, client code and
  performance, styling, GROQ, images/links, RichText.
- **[studio/AGENTS.md](../studio/AGENTS.md)**: Sanity schema rules, field conventions,
  rich text types, structure helpers.

## Tools

- `pnpm mocks:build`: build the product-mock gallery
  (`tools/product-mocks/out/index.html`) with a Save PNG button per screen.
- The agent skills in `.agents/skills/` ([guides/skills.md](./guides/skills.md)):
  `sanity-optimizations` audits Sanity queries, images and caching; `link-fix`
  and `generate-alts` clean up links and alt texts in the dataset.
- Speed: PageSpeed Insights or Lighthouse, mobile, median of three runs
  ([guides/before-release.md](./guides/before-release.md) → 8.4).
