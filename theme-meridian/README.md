# Meridian Starter

> An opinionated Next.js and Sanity starter template designed to speed up project development with built-in features required in all projects.

## Stack

- **Pnpm** - Package manager (workspace monorepo)
- **Next.js 16** - React framework with Turbopack support
- **Sanity 6** - Headless CMS
- **TypeScript 7** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **C15t** - Cookie consent management
- **Zod** - Schema validation
- **Oxlint & Oxfmt** - Fast Rust-based linting and formatting

## Workspace Structure

This is a **pnpm workspace monorepo** with two packages:

- **`web/`** — Next.js 16 application with embedded Sanity Studio at `/admin`
- **`studio/`** — Standalone Sanity Studio (same schemas, for editors)

Schema types live in `studio/` and are imported by `web/` via the `@meridian/studio` workspace dependency. This means **schemas are edited in `studio/`**, while frontend code (queries, components, types) lives in `web/`.


> Detailed conventions live in package-specific docs: [`web/AGENTS.md`](web/AGENTS.md), [`studio/AGENTS.md`](studio/AGENTS.md), and the root [`AGENTS.md`](AGENTS.md).

## Goal

To speed up project development by providing:

- Built-in features required in all projects (preview, revalidation, etc.)
- Pre-configured schemas and components
- Best practices and conventions
- Type-safe development workflow

## Installation

There are three ways in. All three end at the same place: a running site that
shows a **Next steps** screen until the dataset has its first content.

### Option A: `sanity init` (recommended)

```bash
npm create sanity@latest -- --template Pagepro/nexity/theme-meridian
```

The Sanity CLI creates (or picks) a Sanity project and dataset, downloads the
template, writes `web/.env.local` and `studio/.env` with the project id and
dataset, creates a **read token** (`SANITY_API_READ_TOKEN`) and a **write token**
(`SANITY_API_WRITE_TOKEN`, used only by `pnpm seed`), adds the localhost CORS
origins and installs the dependencies. Then:

```bash
pnpm dev     # http://localhost:3000 shows the Next steps screen
pnpm seed    # Meridian demo content from seed/meridian.tar.gz (see seed/README.md)
```

Reload the site and continue with [Next steps after init](#next-steps-after-init).

> The command checks the template with the same validator CI runs
> (`.github/workflows/validate-template.yml`).

### Option B: Deploy with Vercel

See [Deploy to Vercel](#deploy-to-vercel). The deployed site shows the same Next
steps screen until you add content.

### Option C: clone by hand

1. Install dependencies (below).
2. Create a Sanity project and the tokens, then fill `web/.env` and `studio/.env` (below).
3. Run `pnpm seed` (imports the Meridian demo dataset), or create Site settings, the `/` page, the header and the footer in the Studio ([First Steps](#first-steps)).
4. Continue with [Next steps after init](#next-steps-after-init).

### Next steps after init

None of these block `pnpm dev`; the site runs without them. Do them before the
first real deploy.

1. **Rename the template** (optional, cosmetic): the `@meridian` package scope
   and the `Meridian` display name. [`docs/agents/template-setup.md`](docs/agents/template-setup.md)
   lists every file.
2. **Set the remaining env vars** that `sanity init` can't create:
   `SANITY_REVALIDATE_SECRET` (`openssl rand -hex 32`) and, for live preview
   updates, `SANITY_PREVIEW_TOKEN`. `pnpm --filter @meridian/web envs:validate`
   and the Next steps screen list what is still missing.
3. **Link the Sanity blueprint** (CORS + revalidate webhook). First check the
   two blueprint variables in `web/.env.local`, because the blueprint reads them
   and refuses anything that isn't a full origin:
   - `SANITY_BLUEPRINT_SITE_URL`: **your site's URL** with the protocol and no
     trailing slash, e.g. `https://acme.com` or `https://acme.vercel.app`. Leave
     it **empty** until the site has a domain; then the stack starts empty, and
     the site origin and the webhook come later.
   - `SANITY_BLUEPRINT_EXTRA_ORIGINS`: optional, comma-separated, each with the
     protocol (`https://www.acme.com,https://*-acme-team.vercel.app`), or empty.

   **Localhost:** the blueprint declares no localhost origin. Sanity creates
   `http://localhost:3333` (the standalone Studio) with every project, and
   `sanity init` adds `http://localhost:3000` (the site and `/admin`). Add another
   port only when you need it, e.g.
   `SANITY_BLUEPRINT_EXTRA_ORIGINS=http://localhost:3001`. On a hand clone (no
   `sanity init`) add `:3000` once:
   `pnpm --filter @meridian/studio exec sanity cors add http://localhost:3000 --credentials`.

   A value like `acme.vercel.app` (no `https://`) stops `blueprints init` and
   `plan` with `[blueprint] "…" is not an origin`. Then run
   `pnpm exec sanity blueprints init . --project-id <id> --stack-name production`,
   `pnpm blueprints:plan` and `pnpm blueprints:deploy`
   ([`docs/guides/sanity-blueprints.md`](docs/guides/sanity-blueprints.md)).

   **If `blueprints:deploy` fails with `409 Duplicate origin`:** a CORS origin
   the blueprint declares (the site URL or an extra origin) already exists in the project, created by hand, by `sanity init` or
   in sanity.io/manage. The blueprint can't take over an existing origin, and
   the failed deploy is rolled back completely, so nothing is half-applied.
   Delete each origin the error names (the log shows it as
   `Failed to create "cors-…"`), then deploy again; from then on the stack owns it:

   ```bash
   pnpm --filter @meridian/studio exec sanity cors list                 # what the project has
   pnpm --filter @meridian/studio exec sanity cors delete <origin>      # each one the error names
   pnpm blueprints:deploy
   ```

   Between the delete and the deploy that origin has no CORS entry (the Studio
   on it can't log in for those few seconds), so run both one after the other.
   Don't delete `http://localhost:3000` or `:3333`: the blueprint doesn't declare
   them, so they never cause the 409, and the stack won't recreate them.
4. **Revoke `SANITY_API_WRITE_TOKEN`** in [sanity.io/manage](https://www.sanity.io/manage)
   once you no longer seed content, and delete it from `web/.env.local`.
5. **Deploy**: [Deploy to Vercel](#deploy-to-vercel), then work through
   [`docs/guides/before-release.md`](docs/guides/before-release.md).

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPagepro%2Fnexity%2Ftree%2Fmain%2Ftheme-meridian&root-directory=web&env=NEXT_PUBLIC_SANITY_PROJECT_ID,NEXT_PUBLIC_SANITY_DATASET,SANITY_API_READ_TOKEN,SANITY_REVALIDATE_SECRET&envDescription=Sanity%20project%20id%20and%20dataset%2C%20a%20Viewer%20token%2C%20and%20a%20random%20secret%20for%20the%20revalidate%20webhook%20(openssl%20rand%20-hex%2032).&envLink=https%3A%2F%2Fwww.sanity.io%2Fmanage)

The button clones the repo into your GitHub account and creates a Vercel project
with **Root Directory `web`**. It asks for four variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | From [sanity.io/manage](https://www.sanity.io/manage), or `sanity init` (Option A) |
| `NEXT_PUBLIC_SANITY_DATASET` | Usually `production` |
| `SANITY_API_READ_TOKEN` | A **Viewer** token (API → Tokens) |
| `SANITY_REVALIDATE_SECRET` | `openssl rand -hex 32`; the same value goes into the blueprint |

`NEXT_PUBLIC_BASE_URL` is optional on Vercel: without it the site uses the
production domain (`VERCEL_PROJECT_PRODUCTION_URL`) on production and the
deployment URL on previews (`web/src/setup/base-url.ts`). Set it once you have the
final domain.

After the first deploy:

1. **Add the Vercel domain to the Sanity CORS origins**, or the Studio at
   `/admin` can't log in: set `SANITY_BLUEPRINT_SITE_URL` to the site's URL
   (`https://<project>.vercel.app` or your domain, with `https://`, no trailing
   slash) and deploy the blueprint ([`docs/guides/sanity-blueprints.md`](docs/guides/sanity-blueprints.md)).
   That also creates the revalidate webhook.
2. **Add content**: the deployed site shows the Next steps screen on an empty
   dataset. Run `pnpm seed` locally against the same project and dataset, or
   publish the documents in `/admin`.
3. **Pull the env locally** if you cloned after deploying: `vercel env pull web/.env.local`.

> The button and `sanity init` both need the repository to be public, or access
> for the account that runs them. `sanity init` downloads only the starter
> folder, so the template's CI (at the template repository root) never reaches your project.

### 1. Clone and Install Dependencies

```bash
# Install dependencies (installs both web/ and studio/ workspaces)
pnpm i
```

> Requires Node `>=22.12.0` and pnpm `12.x` (see `packageManager` / `engines` in the root `package.json`).

### 2. Environment Variables

#### Sanity tokens

Create them in [sanity.io/manage](https://www.sanity.io/manage) → your project →
**API → Tokens → Add API token**. A token is shown once, so paste it into the
`.env` file straight away.

| Token | Permission | Variable | Needed for |
|---|---|---|---|
| Read token | **Viewer** | `SANITY_API_READ_TOKEN` | Recommended. Draft mode and the visual editor, and reading a private dataset. Without it the site still runs on a public dataset, with draft mode off |
| Preview token | **Viewer** | `SANITY_PREVIEW_TOKEN` | Optional. Live updates in the visual editor. Without it the preview still renders, it just doesn't refresh live |
| Write token | **Editor** | `SANITY_API_WRITE_TOKEN` | Only the seed script (`pnpm seed`). The older name `SANITY_API_TOKEN` still works. Revoke it once seeding is done |

`sanity init` (Option A) creates the read and the write token for you.

Generate the webhook secret yourself: `openssl rand -hex 32`.

#### `web/.env` (or `web/.env.local`)

Create a `.env` file in the `web/` directory (`cp web/.env.example web/.env`) and set the required environment variables. `web/.env.local` works too and wins over `.env`, as in Next; it is the file `sanity init` writes, and every script here (`envs:validate`, `pnpm seed`, the blueprint) reads both.

```ini
# Required (validated in web/src/setup/envVariables.ts)
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production

# Recommended: the site runs without them, `envs:validate` and the Next steps screen warn
SANITY_API_READ_TOKEN=your-read-token          # Viewer token: draft mode, visual editor, private datasets
SANITY_REVALIDATE_SECRET=your-secret          # Webhook signing secret: `openssl rand -hex 32`; same value on Vercel
SANITY_PREVIEW_TOKEN=your-preview-token       # Viewer token for live updates in the visual editor (src/sanity/lib/token.ts)

# Optional
NEXT_PUBLIC_SANITY_API_VERSION=2024-12-01    # Unset: 2024-12-01 (src/sanity/lib/env.ts)
NEXT_PUBLIC_BASE_URL=http://localhost:3000   # Must NOT end with a slash. Unset: the Vercel URL, else localhost:3000 (src/setup/base-url.ts)
SANITY_API_WRITE_TOKEN=                       # Editor token, only for `pnpm seed`; revoke it after seeding
SANITY_BLUEPRINT_SITE_URL=                    # Your site's URL, e.g. https://acme.com (with https://, no trailing slash); empty until known. Read only by sanity.blueprint.ts (site CORS origin + webhook)
SANITY_BLUEPRINT_EXTRA_ORIGINS=               # Comma-separated extra CORS origins, each with the protocol (www, preview wildcard); may stay empty
HTTP_BASIC_AUTH=username:password             # Basic HTTP auth for dev/staging
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX                # Google Tag Manager ID
IS_INDEXABLE=                                 # "true" | "false" | unset — search-engine indexing switch (see below)
VERCEL_AUTOMATION_BYPASS_SECRET=              # Vercel "Protection Bypass for Automation" — lets the redirect proxy read /api/redirects on protected previews

# Optional - Contact form (Resend, used in web/src/app/actions/sales-inquiry.ts)
RESEND_API_KEY=your-resend-key
CONTACT_FORM_RECIPIENT_EMAIL=inbox@example.com
CONTACT_FORM_FROM_EMAIL=noreply@example.com
```

> **Note:** Only `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are required; `pnpm dev` and `pnpm build` won't start without them. A variable left empty (`KEY=`) counts as unset. The recommended ones are warnings, so a project fresh from `sanity init` or the Deploy button boots and tells you what is left. See `web/.env.example` for the full template.

> **Note:** `SANITY_REVALIDATE_SECRET` signs the revalidate webhook (`/api/revalidate`, `/api/revalidate-all`). The webhook itself is declared in `sanity.blueprint.ts` and deployed with `pnpm blueprints:deploy`.

#### `studio/.env`

The standalone Studio (`pnpm dev:studio`, port 3333) reads its own `studio/.env`
(`cp studio/.env.example studio/.env`). The Studio embedded in the site at `/admin`
uses `web/.env` and doesn't need this file.

```ini
SANITY_STUDIO_PROJECT_ID=your-project-id      # Same project as NEXT_PUBLIC_SANITY_PROJECT_ID
SANITY_STUDIO_DATASET=production              # Same dataset as NEXT_PUBLIC_SANITY_DATASET
SANITY_STUDIO_API_VERSION=2024-12-01
SANITY_STUDIO_APP_URL=http://localhost:3000   # The site; the Styleguide tool and the SEO preview link to it
```

> **Warning:** `web/.env` and `studio/.env` must point at the **same project and
> dataset**. Nothing checks this. With a mismatch, the Studio edits one project
> while the site reads another, and your edits never appear on the site.

> **Note:** A new variable the site reads at runtime goes in `web/src/setup/envVariables.ts` (validated, blocks `dev`/`build` when required), a recommended one in `web/src/setup/env-recommendations.ts` (a warning only). `SANITY_BLUEPRINT_*` is read only by `sanity.blueprint.ts`.

> **`IS_INDEXABLE` (fail-closed):** `"false"` blocks indexing everywhere (pre-launch kill switch). Vercel preview and development deployments are always blocked. `"true"` allows indexing, and is required on non-Vercel hosts. **Unset** allows indexing only on Vercel production. When a page isn't indexable, it gets `noindex, nofollow`, `robots.txt` answers `Disallow: /`, and **no JSON-LD is emitted**. So to see structured data in local dev, run with `IS_INDEXABLE="true"`. It's resolved in `web/src/lib/env.ts` and flipped as part of [`docs/guides/before-release.md`](docs/guides/before-release.md).

### 3. Start Development Server

```bash
# Start both web and studio in parallel
pnpm dev

# Or start them individually
pnpm dev:web      # Next.js web app only (includes embedded studio at /admin)
pnpm dev:studio   # Standalone Sanity Studio only
```

When running `pnpm dev:web` the following will be available:

- **Website**: http://localhost:3000
- **Embedded Sanity Studio**: http://localhost:3000/admin

> **Tip:** for local schema and content work use the standalone Studio at
> http://localhost:3333 (`pnpm dev:studio`). It reloads faster because it doesn't go
> through the Next.js compiler. Production has only the embedded Studio at `/admin`;
> the standalone Studio is a local tool and is never deployed.

Running on another port (e.g. `pnpm dev:web -- --port 6134`)? Set `NEXT_PUBLIC_BASE_URL`
to that origin — the Studio's Editor and Preview tabs read it to find the site in dev.

### 4. Environment Validation

Environment variables are automatically validated before the `web` package's `dev` and `build` commands (via `predev` / `prebuild`). You can also validate manually:

```bash
pnpm --filter @meridian/web envs:validate
```

### 5. Type Generation

TypeScript types are automatically generated from your Sanity schema before the `web` package's `dev` and `build` commands. You can also generate them manually:

```bash
pnpm --filter @meridian/web ts:typegen
```

This command runs:
1. `ts:extract` - Extracts schema types from Sanity
2. `ts:generate` - Generates TypeScript definitions

## First Steps

### Initial Setup

On an empty dataset every route shows a **Next steps** screen
(`web/src/ui/getting-started/`) instead of the site. It lists which of the
documents below are missing and which recommended env vars are unset, and it
goes away by itself once all four documents are published. There is nothing to
remove before launch.

The fastest way past it is `pnpm seed` (`web/scripts/seed.mjs`). It imports the
Meridian demo dataset, `seed/meridian.tar.gz` (pages, posts, case studies, podcast
episodes, authors, testimonials, integrations, the listing pages, header,
footer, Site settings and their images), with `sanity dataset import --replace`:
demo documents with the same `_id` are overwritten, your own documents stay. It
uses `SANITY_API_WRITE_TOKEN` or your `sanity login` session. See
[`seed/README.md`](seed/README.md). Or create them in the Studio at `/admin`:

### Required Documents

| Document | Slug | Use | Notes |
|----------|------|-----|-------|
| `site` | N/A | Global settings | Singleton (`_id: site`) |
| `page` | `/` | Homepage | Must have slug `/` |
| `header` | N/A | Site header | Singleton (`_id: header`); the menu may stay empty |
| `footer` | N/A | Site footer | Singleton (`_id: footer`); the links may stay empty |

The check lives in `web/src/sanity/lib/queries/setup-status.ts` and runs in the
frontend layout.

### Check the setup

Run `pnpm typecheck`, then `pnpm dev`, and confirm:

- [ ] http://localhost:3000 renders the homepage.
- [ ] http://localhost:3000/admin lets you log in and lists your documents.
- [ ] In the Studio, **Open in Visual Editor** on the homepage shows the page with edit overlays.
- [ ] `pnpm blueprints:plan` shows nothing left to create or change (the blueprint is deployed, see [`docs/guides/sanity-blueprints.md`](docs/guides/sanity-blueprints.md)).

**Expected locally, not a bug:** after you edit and publish a page that was already
published, the site outside draft mode keeps showing the old version. Published reads
are cached by tag, and only the Sanity webhook purges that cache, which can't reach
localhost. Check edits in draft mode, or `POST /api/revalidate-all` with the secret.

## What's Built In

> For a non-technical, editor/marketer-facing version of this list (page-builder
> blocks, content types, SEO/AEO features, known gaps), see
> [`docs/FEATURES.md`](docs/FEATURES.md).

### Core Features

- ✅ **Preview Mode** - Sanity visual editing with live preview (draft mode reads through the Live Content API)
- ✅ **Tag-based revalidation** - Published reads are cached with Next cache tags and purged by the Sanity webhook (`/api/revalidate`). Locally the webhook can't reach you, so verify edits to already-published pages in draft mode (see [Troubleshooting](#troubleshooting))
- ✅ **Page Builder** - Flexible section-based page building system
- ✅ **Section color theme** - Per-section Light / Dark / unset. Unset keeps the section's own design surface, and a stored theme always wins over it (`section-themed` + `bg-section-surface`). A transparent header over a dark first section switches to the dark palette when that section opts in with `data-header-overlay` (Hero does)
- ✅ **Shared & Global Sections** - Reusable section bundles (shared) and path-matched before/after sections (global)
- ✅ **Rich Text** - Rich text editor with decorators, links and images; the long-form variant adds pullquote, callout, code, table, video embed and checklist blocks
- ✅ **Links** - `internal` (document reference), `internal path` (typed site-relative path such as `/contact#form` for pages that aren't documents), `external` and `download`. External `http(s)` links always open in a new tab with `rel="noopener noreferrer"`, while `mailto:`/`tel:` don't
- ✅ **SEO** - Per-document `metadata`: title, **SEO title**, description, share image, **canonical URL**, **noIndex / noFollow** and **hreflang** alternates. There is a live **Search appearance** (Google result) preview in Studio. Title precedence lives in ONE pure module (`@meridian/studio/seo-title`) shared by every web metadata builder and the Studio preview, so they can't disagree. Auto-generated `sitemap.xml` (excludes noIndex and canonical-override docs), `robots.txt`, `llms.txt`, and an `IS_INDEXABLE` switch
- ✅ **Structured data (JSON-LD)** - `@graph` with Organization, WebSite, WebPage, BreadcrumbList, Article + Person on posts and case studies, and FAQPage + Question from FAQ sections (`web/src/lib/schema-org/`). Organization details and default page types live in Site settings → Structured Data, with a per-document override
- ✅ **Markdown for AI agents** - Every page also answers as Markdown at `/x.md` (the homepage is `/index.md`) or with `Accept: text/markdown`, built from the CMS data by a serializer per section (`web/src/lib/markdown/`). Pages announce it with `<link rel="alternate">`, `llms.txt` links to it, and posts, case studies and episodes get a "Copy as Markdown" button. See [`docs/guides/markdown-for-agents.md`](docs/guides/markdown-for-agents.md)
- ✅ **Embedded Studio** - Sanity Studio available at the `/admin` route
- ✅ **HTTP Basic Auth** - Optional password protection for dev/staging environments
- ✅ **404 Handler** - Custom 404 error page support
- ✅ **Redirects (request time)** - The CMS redirect schema is resolved **on the fly** by `web/src/proxy.ts` from a tagged `/api/redirects` table, so a published redirect goes live in about 1–2 min with **no rebuild**. 308/307 per the `permanent` flag, the query string is preserved, and `:slug` / `:path*` patterns work. Chains collapse to one hop (A→B→C serves A→C), loops are dropped, and if the table can't load, requests go through without redirects.

### Code Quality

- ✅ **Oxlint & Oxfmt** - Pre-configured Rust-based linting and formatting (`pnpm lint`, `pnpm format`)
- ✅ **TypeScript** - Full type safety with auto-generated Sanity types
- ✅ **Unit tests** - `node:test` runner over `web/src/**/*.test.mts` and `web/scripts/**/*.test.mjs` (`pnpm --filter @meridian/web test`). Import the module under test by relative path with a `.ts` extension, and keep type-only imports as `import type`
- ✅ **Agent layer** - `AGENTS.md` files (root, `web/`, `studio/`) with the short rules and `docs/agents/` with the full checklists, `DESIGN.md` (how the site looks) and `BRAND.md` (what it says), for any coding agent (each `CLAUDE.md` is a one-line `@AGENTS.md` import). Skills, reviewer agents and install/update/doctor commands ship in `.agents/` ([docs/guides/skills.md](docs/guides/skills.md))

### Sanity Schemas

Pre-built schemas (defined in `studio/src/sanity/schemaTypes/`):

**Objects** (main ones):
- `img` - Image with alt text, crop/hotspot and responsive variants
- `link` - Link object (internal / internal path / external / download)
- `cta` - Call-to-action with variants and icons
- `richText` - Rich text with headings, lists, links and images
- `simpleRichText` - Short UI copy: decorators and links, no lists
- `pageRichText` - Long-form text: lists, images, pullquote, callout, code, table, video embed and checklist
- `icon` - Icon selector
- `section-options` - Per-section options (color theme Light/Dark/unset, dividers, etc.)
- `metadata` - SEO/metadata object (slug, title, SEO title, description, image, canonical, noIndex, noFollow, hreflang)

**Documents:**
- `site` - Global site settings (singleton)
- `header` - Header configuration (singleton)
- `footer` - Footer configuration (singleton)
- `page` - Page builder with sections
- `global-section` - Path-matched sections rendered before/after page content
- `shared-section` - Reusable bundle of sections referenced from many pages
- `blog-listing-page` - Blog listing page (singleton)
- `post` - Blog post detail document
- `case-studies-listing-page` - Case studies listing page (singleton)
- `case-study` - Case study detail document
- `podcast-listing-page` - Podcast listing page (singleton)
- `podcast-episode` - Podcast episode detail document
- `author` - Author of posts, case studies and episodes
- `testimonial` - Reusable testimonial
- `integration` - Reusable integration entry
- `redirect` - URL redirects
- `rewrite` - URL rewrites (serve one path under another)
- `internal.typeSource` - Hidden document used to generate fragment types for type safety (`__type-source.ts`)

## Rules of Working

### Consistency

- Always use `richText`, `simpleRichText`, `pageRichText`, `link`, `cta` where possible
- Always use the `Image` component (`@/ui/components/image`) for images (handles Sanity image logic)
- Always use `BaseLink` or other variants for links (handles internal / internal path / external / download logic, new-tab rules)
- Use initial sections as examples for new sections
- Prefer types in a separate `types.ts` file instead of inline

### Development Workflow

- **AI Assistance** - Use AI to scaffold sections and schemas (at least initially)
- **Preview Testing** - Test your sections in preview mode to find out if you need `stegaClean` for string values
- **Use `stegaClean`** - Use `stegaClean` for string value types if you use them in UI logic
- **Tailwind Classes** - Avoid using custom Tailwind classes like `[23px]` - add variables to the theme instead
- **Lighthouse** - Check Lighthouse from time to time to ensure good performance
- **Agent rules** - Update `AGENTS.md` when an agent keeps getting something wrong

### Performance

- **Server-Side Fetching** - All Sanity fetching should be done on the server side
- **Server-Side Cache** - If we are using SSR - use components cache for caching
- **Client Components** - Avoid using client components unless you need interactions
- **Lazy Loading** - Use lazy loading for sections and other components
- **Image Optimization** - Update the `sizes` prop of the `Image` component if you know the image takes less than full width

### Code Quality

- **Linting/formatting** - Oxlint + Oxfmt (Rust) replaced ESLint + Prettier. Run `pnpm lint` / `pnpm format`; use `pnpm lint:strict` for type-aware rules
- **Type Safety** - Avoid `any` and casting if possible - try to match existing types

## How to Create a New Section

Schemas live in `studio/`, the query and component live in `web/`. See [`docs/agents/new-section.md`](docs/agents/new-section.md) for the canonical checklist (summarised in [`AGENTS.md`](AGENTS.md) → "Creating a New Section").

> **Three compile-time guards** make `pnpm typecheck` fail until a new section is fully wired: the Sections Gallery registry (`SECTION_TYPES` / `SECTION_META` / fixture), `SECTION_SCHEMA_CONTRIBUTORS` in `web/src/lib/schema-org/build-graph.ts`, where you declare what the section adds to the JSON-LD graph (most sections are `null`, with a reason), and `SECTION_MARKDOWN_SERIALIZERS` in `web/src/lib/markdown/section-serializers.ts`, which needs the section's `markdown.ts` serializer. Don't forget `studio/.../fragments/sections.ts` either (`INNER_SECTIONS` + insert menu), or editors can't insert the section. If the section paints its own background, use `bg-section-surface` rather than a raw `bg-muted`, so the editor's Color theme can override it.

### Step-by-Step Guide

1. **Add Schema**
   - Create a new schema file in `studio/src/sanity/schemaTypes/sections/`
   - Focus on good UX: fieldsets, visibility of fields, groups, and good descriptions
   - Try to reuse existing objects if possible
   - Use `simpleRichText` for text values if they can potentially have decorators (bold, italic, sup, sub) or links
   - Include the `section-options` field as the first field item

2. **Register Schema**
   - Add the new schema type to `schemaTypes` in `studio/src/sanity/schemaTypes/index.ts`

3. **Update Queries**
   - Add a conditional branch for the new section to `SECTION_BRANCHES_QUERY` in `web/src/sanity/lib/queries.ts` (`SECTIONS_QUERY` spreads it)
   - Include all necessary reference resolutions

4. **Generate Types**
   ```bash
   pnpm --filter @meridian/web ts:typegen
   ```

5. **Update Type Definitions**
   - If your component reflects the Sanity schema, use the `ExtractSectionProps<>` utility from `web/src/types/sections.ts`

6. **Create Component**
   - Create a component that matches your design in `web/src/ui/sections/<MySectionName>/index.tsx`
   - Use the `section` class on the `<section>` element for horizontal padding (see [`web/AGENTS.md`](web/AGENTS.md))
   - Use the `Image` component for images and `BaseLink` for links

7. **Register Component**
   - Add the new component mapping to `INNER_SECTION_MAP` in `web/src/ui/sections/map.ts`
   - The top-level `SECTION_MAP` in `web/src/ui/sections/index.tsx` spreads `INNER_SECTION_MAP` and adds the `shared-section-ref` wrapper

### Example Section Structure

```typescript
// studio/src/sanity/schemaTypes/sections/my-section.ts
import { defineField, defineType } from "sanity";
import { VscSymbolMisc } from "react-icons/vsc";

export default defineType({
  name: "my-section",
  title: "My Section",
  icon: VscSymbolMisc,
  type: "object",
  groups: [
    { name: "content", default: true },
    { name: "options" },
  ],
  fields: [
    defineField({
      name: "options",
      title: "Section options",
      type: "section-options",
      group: "options",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
    }),
    // ... more fields
  ],
});
```

## How to Add a New Document Type

See [`docs/agents/new-document-type.md`](docs/agents/new-document-type.md) for the full workflow.

### Step-by-Step Guide

1. **Create Schema**
   - Create a new schema in `studio/src/sanity/schemaTypes/documents/`

2. **Register Schema**
   - Add the new document type to `schemaTypes` in `studio/src/sanity/schemaTypes/index.ts`

3. **Update Structure**
   - Add the new document type in `studio/src/sanity/structure.tsx`
   - If it has a frontend route, wrap it with one of the preview helpers from `studio/src/sanity/lib/structure.tsx` (`createDocumentListWithPreview`, `createSingletonWithPreview`, or `createDocumentListWithSlugPrefix`) so editors get the "Open In Visual Editor" tab

4. **Update Presentation**
   - Update the `studio/src/sanity/presentation.ts` resolver to include your new page type

5. **Update Queries & Generate Types**
   - Add a query in `web/src/sanity/lib/queries.ts` (or a dedicated file under `web/src/sanity/lib/queries/`)
   - Run `pnpm --filter @meridian/web ts:typegen`

6. **Create Route**
   - Create a new route in `web/src/app/(frontend)/`, OR
   - Add the new type to the catchall page `web/src/app/(frontend)/[[...slug]]/page.tsx` if appropriate

7. **Update SEO Files**
   - Update `web/src/app/sitemap.ts` with the new document type if it's publicly discoverable
   - Update `web/src/app/llms.txt/route.ts` (`LLMS_DATA_QUERY`) to include this document type if it's public
   - If it has its own route, give it a Markdown version: a template in `web/src/lib/markdown/documents.ts` and a loader in `load-markdown.ts` (see `docs/agents/new-document-type.md`, step 9)

## How to Add New Types

This project uses an automated type generation system powered by Sanity's typegen. Types are generated from GROQ queries wrapped in `defineQuery`.

### Type System Overview

```
web/src/types/
├── sanity.types.ts    # Auto-generated types (DO NOT EDIT)
├── fragments.ts       # Type aliases for universal fragments (link, image, etc.)
└── sections.ts        # Type utilities for page sections
```

### Universal Fragment Types (Link, Image, etc.)

For reusable types like `link`, `image`, or `metadata`, follow this pattern:

#### Step 1: Add field to the Type Source Document

Add the field to `studio/src/sanity/schemaTypes/documents/__type-source.ts`:

```typescript
import { defineField, defineType } from "sanity";

export default defineType({
  name: "internal.typeSource",
  type: "document",
  hidden: true,
  fields: [
    // Existing fields...
    defineField({
      name: "myNewFragment",
      type: "myNewType", // Your Sanity schema type
    }),
  ],
});
```

#### Step 2: Create Fragment File

Create a fragment file in `web/src/sanity/lib/fragments/`:

```typescript
// web/src/sanity/lib/fragments/my-fragment.ts
import { defineQuery } from "groq";

export const MY_FRAGMENT = `
  field1,
  field2,
  nested {
    nestedField
  }
`;

// IMPORTANT: Use defineQuery to enable type generation
export const MyFragmentQuery = defineQuery(`*[_type == "internal.typeSource"][0] {
  myNewFragment { ${MY_FRAGMENT} }
}.myNewFragment`);
```

> **Important:** The query MUST use `defineQuery` from the `groq` package. This is required for automatic type generation.

#### Step 3: Add Type Alias

Add the type alias to `web/src/types/fragments.ts`:

```typescript
import {
  ImageQueryResult,
  LinkQueryResult,
  MetadataQueryResult,
  MyFragmentQueryResult  // Import generated type
} from "./sanity.types";

export type ImageFragment = NonNullable<ImageQueryResult>;
export type LinkFragment = NonNullable<LinkQueryResult>;
export type MetadataFragment = NonNullable<MetadataQueryResult>;
export type MyFragment = NonNullable<MyFragmentQueryResult>; // Add new type
```

#### Step 4: Generate Types

```bash
pnpm --filter @meridian/web ts:typegen
```

### Component-Specific Types

For types specific to a component (e.g., header menu items), use the `Extract` pattern:

```typescript
// web/src/ui/my-component/types.ts
import { MyComponentQueryResult } from "@/types/sanity.types";

// Base props interface
export interface MyComponentProps {
  title: string | null;
  items: NonNullable<MyComponentQueryResult>["items"];
}

// Extract specific item types from a union
export type MyItem = NonNullable<NonNullable<MyComponentQueryResult>["items"]>[number];

// Extract specific type from discriminated union
export type SpecificItem = Extract<MyItem, { _type: "specificType" }>;

// Extract nested items
export type NestedItems = SpecificItem["nestedField"];
export type NestedItem = NonNullable<NestedItems>[number];
```

### Section Types

For page section types, use the utilities in `web/src/types/sections.ts`:

```typescript
import { ExtractSectionProps } from "@/types/sections";

// Get props for a specific section type
type HeroProps = ExtractSectionProps<"hero">;
type TextBlockProps = ExtractSectionProps<"text-block">;
```

### Key Rules

1. **Always use `defineQuery`** - Queries must be wrapped in `defineQuery` from `groq` for type generation to work
2. **Use `NonNullable`** - Always wrap query results to handle nullable types
3. **Use `Extract` for unions** - When you have discriminated unions (`_type`), use `Extract<Union, { _type: "specific" }>`
4. **Run typegen after schema changes** - Always run `pnpm --filter @meridian/web ts:typegen` after modifying schemas or queries
5. **Don't edit `sanity.types.ts`** - This file is auto-generated and will be overwritten

### Type Generation Commands

```bash
# Full type generation (extract schema + generate types)
pnpm --filter @meridian/web ts:typegen

# Extract schema only
pnpm --filter @meridian/web ts:extract

# Generate types only (after schema extraction)
pnpm --filter @meridian/web ts:generate
```

## Available Scripts

### Root scripts (run from repo root — affect the whole workspace)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start both web and studio in parallel |
| `pnpm dev:web` | Start the Next.js web app only (embedded studio at `/admin`) |
| `pnpm dev:studio` | Start the standalone Sanity Studio only |
| `pnpm build` | Build the Next.js web app |
| `pnpm start` | Start the production web server |
| `pnpm mocks:build` | Re-render the product mocks in `tools/product-mocks/` to PNG (needs python3; [docs/guides/product-mocks.md](docs/guides/product-mocks.md)) |
| `pnpm seed` | Import the Meridian demo dataset (`seed/meridian.tar.gz`) into `NEXT_PUBLIC_SANITY_DATASET` (`--dataset=<name>` for another); replaces demo documents with the same ids. Uses `SANITY_API_WRITE_TOKEN` or your `sanity login` session |
| `pnpm lint` | Run Oxlint over the repo, then `check:client` |
| `pnpm lint:fix` | Run Oxlint with auto-fix over the repo |
| `pnpm lint:strict` | Oxlint with type-aware rules |
| `pnpm check:client` | Client-boundary check: heavy server-side modules (`RichText`, `Image`, `ButtonLink`, `cn()`, …) stay out of `"use client"` code ([web/AGENTS.md](web/AGENTS.md)) |
| `pnpm format` / `pnpm format:check` | Format with Oxfmt / check formatting |
| `pnpm typecheck` | Run TypeScript type checking in all packages |
| `pnpm blueprints:plan` | Preview the diff of `sanity.blueprint.ts` (CORS origins + revalidate webhook) against the live Sanity project. Read-only |
| `pnpm blueprints:deploy` | Apply that diff (run `plan` first) |
| `pnpm blueprints:info` | Show what is deployed on the linked stack |
| `pnpm dev:web:next` | Run `next dev` in `web/` without the `predev` env check and typegen |
| `pnpm agent:install` / `agent:update` / `agent:doctor` | Install, update or check the agent skills and agents in `.agents/` ([docs/guides/skills.md](docs/guides/skills.md)) |

### Web package scripts (run with `--filter @meridian/web`)

| Command | Description |
|---------|-------------|
| `pnpm --filter @meridian/web ts:typegen` | Generate TypeScript types from Sanity schema |
| `pnpm --filter @meridian/web ts:extract` | Extract schema only |
| `pnpm --filter @meridian/web ts:generate` | Generate types only (after extraction) |
| `pnpm --filter @meridian/web envs:validate` | Validate environment variables |
| `pnpm --filter @meridian/web manifest` | Extract the Sanity manifest for the embedded Studio |
| `pnpm --filter @meridian/web test` | Run unit tests (`node:test`, `*.test.mts` / `*.test.mjs`) |

### Studio package scripts (run with `--filter @meridian/studio`)

| Command | Description |
|---------|-------------|
| `pnpm --filter @meridian/studio deploy` | Deploy the standalone Sanity Studio |

## Project Structure

```
.
├── package.json              # Root workspace scripts
├── pnpm-workspace.yaml       # Workspace package definitions
├── sanity.blueprint.ts       # CORS origins + revalidate webhook (pnpm blueprints:*)
├── LICENSE                   # MIT
├── AGENTS.md                 # Project rules for every coding agent (short; links docs/agents/)
├── CLAUDE.md                 # `@AGENTS.md`: loads AGENTS.md into Claude Code
├── CONCEPTS.md               # Shared vocabulary of the project
├── DESIGN.md                 # How the site looks: tokens + usage rules
├── BRAND.md                  # What the site says: audience, voice, messaging
├── seed/                     # Meridian demo dataset (pnpm seed)
├── tools/product-mocks/      # HTML product mocks → PNG (pnpm mocks:build)
├── docs/                     # Starter docs: FEATURES.md, guides/, agents/ (full agent checklists)
│
├── web/                      # Next.js 16 application (@meridian/web)
│   ├── sanity.config.ts      # Embedded Studio config
│   └── src/
│       ├── app/              # Next.js App Router
│       │   ├── (frontend)/   # Public-facing routes (catchall [[...slug]])
│       │   ├── (studio)/     # Embedded Studio at /admin
│       │   ├── (styleguide)/ # /styleguide and the Sections Gallery
│       │   ├── actions/      # Server actions (contact form)
│       │   ├── api/          # API routes (draft-mode, revalidate, redirects, markdown, og, newsletter, listings)
│       │   ├── sitemap.ts    # Sitemap generation
│       │   ├── robots.ts     # Robots.txt generation
│       │   └── llms.txt/     # llms.txt, built from the CMS, links to the .md pages
│       ├── proxy.ts          # Next 16 proxy: basic auth, request-time CMS redirects, .md / Accept: text/markdown
│       ├── lib/              # env.ts (IS_INDEXABLE), seo-robots, redirect-map, schema-org/ (JSON-LD), markdown/
│       ├── sanity/           # Sanity client, queries, fragments
│       │   └── lib/
│       │       ├── queries.ts      # SECTION_BRANCHES_QUERY, SECTIONS_QUERY and shared branches
│       │       ├── queries/        # Per-document query files
│       │       └── fragments/      # Reusable GROQ fragments
│       ├── setup/            # Env validation config (envVariables.ts)
│       ├── scripts/          # Standalone scripts (validateEnvs.ts, etc.)
│       ├── types/            # TypeScript types
│       │   ├── fragments.ts        # Sanity fragment type aliases
│       │   ├── sanity.types.ts     # Typegen-generated types (DO NOT EDIT)
│       │   └── sections.ts         # Section helper types
│       ├── styles/           # Tailwind v4 theme (app.css)
│       └── ui/               # UI components
│           ├── components/   # Reusable primitives (Image, BaseLink, ...)
│           └── sections/     # Page sections (registered in map.ts)
│
└── studio/                   # Standalone Sanity Studio (@meridian/studio)
    ├── sanity.config.ts      # Standalone Studio config
    └── src/sanity/
        ├── schemaTypes/      # Shared Sanity schemas
        │   ├── documents/    # Document types
        │   ├── objects/      # Object types
        │   ├── sections/     # Section types
        │   ├── fragments/    # Reusable field fragments (sections array)
        │   └── partials/     # Shared partial schemas (linkBaseSchema)
        ├── structure.tsx     # Studio structure
        ├── presentation.ts   # Preview configuration
        └── lib/structure.tsx # Preview helpers (createDocumentListWithPreview, ...)
```

## Before Release

Walk through [`docs/guides/before-release.md`](docs/guides/before-release.md) before launching a project built on this starter. It covers:
- brand assets, `llms.txt` and the `.md` pages;
- the production domain in `sitemap.xml` and `robots.txt` (verified with curl, not config);
- `IS_INDEXABLE`;
- SEO titles and descriptions (a GROQ query in Vision);
- placeholder content;
- Sanity CORS;
- cookie consent and legal links;
- GTM (checked outside draft mode);
- JSON-LD validation;
- redirects, and a stale-`app.css` check.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Sanity Documentation](https://www.sanity.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## Troubleshooting

### Common Issues

**Error: Missing homepage**
- Create a page with slug `/` in Sanity Studio

**Error: Environment variable validation failed**
- Check that all required environment variables are set in `web/.env`
- Run `pnpm --filter @meridian/web envs:validate` to see specific errors

**Types not updating**
- Run `pnpm --filter @meridian/web ts:typegen` manually
- Make sure your schema is properly registered in `studio/src/sanity/schemaTypes/index.ts`

**Preview not working**
- Ensure `SANITY_API_READ_TOKEN` is set correctly
- Check that the document has a valid slug

**Published an edit, but localhost still shows the old page / `<head>`**
- Published reads are tag-cached and only the webhook purges them, and it can't reach localhost. Check the change in draft mode (Studio → *Open In Visual Editor*, then open the page in the same browser; `/api/draft-mode/disable` afterwards), or `POST /api/revalidate-all` with the secret

**No JSON-LD / everything is `noindex` locally**
- Expected unless `IS_INDEXABLE="true"`. The page's own `noIndex` also suppresses JSON-LD and drops it from the sitemap

**A new redirect doesn't fire**
- The proxy reloads its table every 60s, and the CDN caches `/api/redirects` for 60s, so allow about 2 min. Loops are dropped on purpose. Sources are case-sensitive. On protected Vercel previews set `VERCEL_AUTOMATION_BYPASS_SECRET`

**Header links unreadable over a dark first section**
- The section must opt in with `data-header-overlay` so the transparent bar switches to the dark palette

## License

MIT. See [`LICENSE`](LICENSE).
