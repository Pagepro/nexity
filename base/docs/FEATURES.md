# Feature Overview

What this platform offers, written for content editors, marketers, content marketers,
and CMOs — not developers. For technical setup see the root [`README.md`](../README.md);
for domain vocabulary see [`CONCEPTS.md`](../CONCEPTS.md).

All counts are verified against the codebase (`studio/src/sanity/schemaTypes/` and
`web/src/ui/`). When sections or content types are added, update this file.

## 🧱 Page builder — 23 ready-made content blocks

Editors compose any page by stacking and reordering blocks — no developer needed.
Every block also has shared options: show/hide, color theme, top/bottom dividers, and an
anchor ID (for "jump to section" links). The color theme can be **Light** (white), **Dark**
(the site's dark surface, with inverted text), or left **unset** to keep the block's own
design background. The editor's choice always wins. When the first block on a page is
Dark, the transparent header on top of it switches to light text automatically.

| Block | What it does |
|---|---|
| **Hero** | Page-top banner: headline, intro, CTA buttons, background or product image, optional “trusted by” logo row; two layout styles |
| **Feature block** | Rich text + buttons with up to 3 images in three layout variants |
| **Feature grid** | Grid of cards with eyebrow label, headline, image and optional link — each card written by hand or picked from a case study (case-study highlights) |
| **Bento grid** | Capability overview: wide + regular cards with icon, optional stat, title, description and link (corner arrow or “See how ↓” label, incl. in-page anchors); framed, plain or compact icon-beside-text cards, plus an optional row of links |
| **Logos carousel** | Auto-scrolling customer/partner logo strip with adjustable speed |
| **Split sections** | Alternating text/image rows (image side flips automatically), or full-width text rows; optional outcome badge, before/after comparison cards, titled checklist, “example insight” callout, proof point and in-page anchor |
| **Stats** | Headline stats tiles (value + label), up to 4 — as a grid beside a heading, or a single divided band (left or centred) |
| **Contact form** | Contact-sales band: copy and checklist beside a lead form (name, work email, company, team size, message); validated, honeypot-protected, emailed via Resend |
| **Impact calculator** | Interactive ROI estimate: team size, deal size and cycle length drive projected cycle reduction, pipeline recovered and payback |
| **Integrations grid** | Filterable grid of integrations (category tabs + search) from a reusable integrations library — shows every integration automatically or a hand-picked list |
| **CTA banner** | Promotional card with buttons, background image, product screenshot |
| **Testimonials** | Curated customer quotes pulled from a reusable quote library — a card carousel, or one large featured quote |
| **Trust badges** | A thin row of icon + label claims (SOC 2, GDPR, SSO, uptime) |
| **Pricing** | 1–4 plan cards with monthly/yearly toggle, "Most popular" badge, feature checklist |
| **Comparison table** | Plan-comparison or “us vs alternatives” matrix (check/X/partial/text/add-on cells, optional prices and categories, tooltips, footnote) |
| **FAQ** | Two-column Q&A list with optional buttons |
| **Newsletter** | Email-signup band with social-proof line — as a card, or a centred closing CTA with extra buttons beside the form |
| **Blog listing** | Auto-updating blog grid; editor just sets posts per page |
| **Case studies listing** | Auto-updating case-study grid; editor just sets items per page |
| **Podcast listing** | Auto-updating episode archive with topic filter and search; editor just sets episodes per page |
| **Text block** | Simple rich text + CTA buttons, left-aligned or centred (e.g. a closing call to action) |
| **Content section** | Long-form prose for legal pages and articles |
| **Shared section** | Inserts a reusable block bundle (see below) |

## 📝 Content types editors manage (15)

- **Pages** — any marketing page (home, about, pricing…) built from the blocks above
- **Blog** — posts with category, cover image, author, excerpt; plus a configurable
  listing page with a featured-post pin
- **Case studies** — client logo, industry, headline metrics, testimonial, full story;
  plus their own listing page
- **Podcast** — episodes with number, season, topic, guest (from the Authors library),
  summary, chapters, show notes, transcript and per-platform links; plus the podcast page
  (show name, promise, host, cover art, where to listen, pinned latest episode) with a
  searchable, topic-filtered archive
- **Reusable libraries** — authors (bylines), testimonials and integrations, written once, reused everywhere
- **Shared sections** — author a bundle of blocks once, reference it on many pages;
  edit it once and every page updates on the next publish
- **Global sections** — auto-inject a section across whole URL areas (e.g. a banner on
  every `/blog/*` page), with exclusion rules
- **Header, Footer, Site settings** — menus, dropdowns, CTAs, social links, sitewide
  SEO defaults — all CMS-editable
- **Redirects** — marketers set old-URL → new-URL rules themselves (permanent 308 /
  temporary 307). They go live about 2 minutes after publishing, with **no rebuild and no
  developer**. Supports patterns (`/old-blog/:slug` → `/blog/:slug`) and keeps campaign
  query strings (`?utm=…`). A chain (A → B → C) is served as a single hop, and an
  accidental loop is ignored rather than breaking the page.
- **Rewrites** — serve another URL's content under a path on this site without changing
  the address bar, e.g. `/some-file.pdf` → a file uploaded to Sanity, or
  `/docs/:path*` → an external docs site. Same ~2-minute, no-rebuild publishing as
  redirects; the Studio refuses paths the app owns (`/api`, `/admin`, `/_next`).
- **404 page** — the "not found" page is a normal CMS page, fully editable

## 👩‍💻 Editing experience

- **CMS lives on the site itself** at `/admin` — one login, one domain (a standalone
  Studio deployment also exists)
- **Visual click-to-edit preview** — split-screen view of the real site; click any
  element to jump straight to its field
- **Live draft preview** — see unpublished changes stream in real time; visitors only
  ever see published content
- **Instant publishing** — publishing refreshes just the affected pages automatically;
  no rebuild, no developer involved
- **Sections gallery / styleguide** — a visual catalog of all 23 blocks with sample
  content and a "used on N pages" badge, plus brand color/typography galleries
- **SEO guardrails built into the editor** — character counters (60 for titles, 160
  for descriptions), live Google-result preview, protected slugs on fixed-URL pages
- **Safe internal linking** — links to other pages/posts resolve automatically; no
  hand-typed URLs to break. For site pages that aren't CMS documents, an **Internal path**
  link type takes a validated site-relative path (e.g. `/contact` plus `#form`).
  Links to other websites always open in a new tab, while email and phone links don't.

## 📈 Marketing, SEO & AEO

- **Per-page SEO** — page title, a separate **SEO title** for the search result, description,
  social-share image, **"hide from Google" (noIndex)** and **"don't follow links"
  (noFollow)** toggles, a **canonical URL** for duplicate or syndicated content, and
  **language/region alternates (hreflang)**. Sitewide fallbacks come from Site settings.
  The Studio's Google-result preview uses exactly the same title rules as the live site.
- **Auto-generated social share images** when no custom one is uploaded
- **Automatic XML sitemap** covering all pages, blog posts, and case studies, leaving out
  hidden (noIndex) pages and pages that point their canonical elsewhere
- **robots.txt** — staging/preview environments are hidden from Google automatically, and
  a single launch switch (`IS_INDEXABLE`) opens the production site to search engines
- **SEO check before launch** — ready-made queries in the release checklist list every
  page whose title or description is missing, too long, too short or duplicated
- **Structured data (schema.org JSON-LD)** on every page — organization, website,
  page, breadcrumb, article + author on blog posts and case studies, and FAQ questions
  from FAQ blocks. Editors set the organization details (legal name, logo, address,
  social profiles) and the default page type per content type in Site settings →
  Structured Data, and can override the page type on any page
- **AEO (Answer Engine Optimization): `llms.txt`** — the site publishes an
  AI-crawler-friendly index of every public page, post, case study and episode (name,
  one-line summary from Site settings, a short description per item), so AI answer
  engines (ChatGPT, Perplexity, Google AI Overviews) can accurately represent the
  brand when users ask questions. It is built from the CMS, so it stays current with
  every publish; the summary is the Site settings SEO description.
- **Every page as Markdown, for AI agents** — add `.md` to any address (`/pricing.md`,
  `/blog/my-post.md`, the homepage is `/index.md`), or ask for `text/markdown`, and the
  site answers with a clean text version of the same page: headings, copy, prices,
  FAQs, tables and links, with images described by their alt text. Listing pages
  (`/blog.md`, `/case-studies.md`, `/podcast.md`) hold every item in one file. The
  Markdown versions are announced in each page's head and kept out of Google's index,
  so they never compete with the real pages. Blog posts, case studies and podcast
  episodes also get a **"Copy as Markdown"** button, so a reader can paste the page into
  an AI chat. Every block above has a Markdown version, so nothing an editor adds is
  left out.
- **GDPR cookie consent** — themed banner and preferences dialog site-wide
- **Google Tag Manager** — activates via a single configuration value, no code changes
- **Blog & case-study listings** with search-as-you-type, category filter tabs, and
  pagination — all reflected in shareable, bookmarkable URLs
- **Contact-sales form** (Contact form block) — validated, spam-protected (honeypot), delivered via email (Resend) once `RESEND_API_KEY`, `CONTACT_FORM_RECIPIENT_EMAIL` and `CONTACT_FORM_FROM_EMAIL` are set

## ⚡ Site infrastructure marketers benefit from

- Fast, cached page delivery for visitors; editors get the real-time preview channel
- Automatic image optimization via the Sanity image CDN — responsive sizes,
  focal-point cropping, required alt text (accessibility + image SEO)
- PWA manifest + favicons for correct app/home-screen metadata
- Environment-driven configuration — analytics IDs, CMS project, and base URL are set
  per environment without code changes

## ⚠️ Known gaps (pre-launch checklist)

1. **Newsletter signup is UI-only** — the form works but emails aren't stored or sent
   anywhere. Connect it to your email provider (e.g. Resend, Mailchimp or ConvertKit)
   before launch.
2. **`llms.txt` summary comes from Site settings** — fill in the SEO title and
   description there before launch, or the file opens with the bare site name.
3. **Vercel Analytics / Speed Insights** are installed but not activated.
4. **Auto-generated share image is unbranded** (plain title on white) — consider a
   branded template.
5. **Single-language site** — no multi-language support (by design; confirm this
   matches product strategy).
