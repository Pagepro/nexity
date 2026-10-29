# Before release: pre-launch checklist

Run this before a site built on this starter goes live, and again after the DNS
switch. Every item below has broken on a real launch, and in each
case nothing failed loudly: the build was green and the page rendered.

**How to use it.** Each item gives what to check, the exact command, query or URL
to check it with, and what "good" looks like. Check the **deployed** site, not
the config. Most of these bugs were in the gap between what the code says and
what the server actually sends.

```bash
# Set these once per shell. The examples below use them.
export SITE=https://www.example.com          # the production origin, no trailing slash
export PREVIEW=https://<project>.vercel.app  # the Vercel production alias
export PROJECT_ID=<sanity project id>        # web/.env NEXT_PUBLIC_SANITY_PROJECT_ID
export DATASET=production
```

Run GROQ queries in the Studio's **Vision** tool (`/admin` → Vision, perspective
`published`), or with `pnpm --filter @meridian/studio exec sanity documents query '<groq>' --dataset $DATASET`.

---

## 1. Brand: nothing still says "Meridian"

The template ships with a placeholder brand. The rename
([`docs/agents/template-setup.md`](../agents/template-setup.md)) covers the code. These items are the ones people miss.

### 1.1 Favicon, app icons and web manifest

- **Check:** the files in `web/src/app/` (`favicon.ico`, `icon.png`, `icon.svg`,
  `apple-icon.png`) and `web/public/` (`icon-192.png`, `icon-512.png`,
  `meridian-logo.svg`) are the client's artwork. `web/src/app/manifest.ts` has the
  client's `name`, `short_name`, `theme_color` and `background_color`.
- **Command:**
  ```bash
  curl -s  $SITE/manifest.webmanifest              # name / short_name / colors
  curl -sI $SITE/favicon.ico  | grep -i content-length
  curl -sI $SITE/apple-icon.png | head -1           # 200
  curl -s  $SITE/ | grep -oE '<link rel="(icon|apple-touch-icon|manifest)"[^>]*>'
  ```
  Then open `$SITE` in a fresh private window and look at the tab icon, and add
  the page to an iOS home screen (that uses `apple-icon.png`, not the favicon).
- **Good:** the manifest JSON names the client. The icons are the client's mark.
  Nothing mentions Meridian. `git grep -in meridian -- web/src web/public` returns
  nothing outside regenerated artifacts.
- **Trap:** browsers cache favicons hard. Judge from a private window or a
  different browser, not the tab you had open during development.

### 1.2 `llms.txt` and the Markdown pages have the project's content

`web/src/app/llms.txt/route.ts` builds the file from the CMS: the site name and the
Site settings SEO description, then every public page, post, case study and episode,
each linked to its Markdown twin (`/x.md`, see `docs/guides/markdown-for-agents.md`).
Nothing in it is hand-written, so what can go wrong is the data.

- **Command:**
  ```bash
  curl -s $SITE/llms.txt | grep -inE 'lorem|ipsum|todo|\[test\]|meridian'
  curl -s $SITE/llms.txt | head -20
  curl -sI $SITE/index.md | grep -iE '^(content-type|x-robots-tag|link)'
  curl -s -H 'Accept: text/markdown' $SITE/pricing | head -15
  curl -s $SITE/ | grep -o '<link rel="alternate" type="text/markdown"[^>]*>'
  ```
- **Good:** the first command prints nothing. The file opens with the client's name
  and a one-line description (`> …`), every link is an absolute `.md` URL on `$SITE`,
  `/index.md` answers `text/markdown` with `X-Robots-Tag: noindex` and a
  `Link: <…>; rel="canonical"` to the HTML page, and every page's head names its
  Markdown alternate.
- **Also check:** it lists only pages you want listed. A `noIndex` page is left out
  automatically; a retired page that is still published is not. Edit a page title,
  publish it, and confirm both `llms.txt` and that page's `.md` show the change.

### 1.3 Default metadata and the Open Graph card

- **Check:** `processMetadata.ts` falls back to `"Meridian"` when Site settings
  have no SEO title. The `/api/og` card renders the page title on a template
  background.
- **Command:**
  ```bash
  curl -s $SITE/ | grep -oE '<title>[^<]*</title>|<meta property="og:(title|image|site_name)"[^>]*>'
  open "$SITE/api/og?title=Test"
  ```
- **Good:** the `<title>` ends with the client's name, `og:image` resolves to a
  1200×630 image that looks like the client's brand, and a share preview (the
  LinkedIn Post Inspector or the X card validator) renders it.

---

## 2. Crawling and indexing

### 2.1 `sitemap.xml` and `robots.txt` carry the production domain

Both are built from `NEXT_PUBLIC_BASE_URL` (`web/src/app/sitemap.ts`,
`web/src/app/robots.ts`). If that variable is unset, or set to the `vercel.app`
host, for the Production environment, the files point search engines at the
wrong host. **Verify with `curl` against the deployed URL. Reading the config
does not prove what was built.**

- **Command:**
  ```bash
  curl -s $SITE/robots.txt
  curl -s $SITE/sitemap.xml | grep -oE '<loc>[^<]*</loc>' | head
  curl -s $SITE/sitemap.xml | grep -oE '<loc>[^<]*</loc>' | grep -v "<loc>$SITE" | head   # must print nothing
  curl -s $SITE/sitemap.xml | grep -c '<loc>'
  ```
- **Good:** `robots.txt` shows `Allow: /` for `*` and `Sitemap: $SITE/sitemap.xml`.
  Every `<loc>` starts with `$SITE`. None contains `undefined`, `localhost` or
  `vercel.app`. The count matches the number of published, indexable pages, posts
  and case studies.
- **Also check:**
  - Documents with a **Canonical URL** override are **not** in it (they point
    search engines at another URL).
  - Every **listing page** (`/blog`, `/case-studies`, any you added) is in the
    sitemap, not only its detail pages.
  - `noIndex` pages are **not** in it.
  - The `disallow` list in `robots.ts` names only paths you mean to hide. The
    template disallows `/privacy-policy` and `/admin`. Keep `/admin`, and decide
    about the rest per project.
  - The `host:` line is non-standard. Google ignores it. Drop it if it confuses
    an SEO audit.
- **After changing `NEXT_PUBLIC_BASE_URL`, redeploy.** `NEXT_PUBLIC_*` values are
  read at build time.

### 2.2 `IS_INDEXABLE` is flipped at launch

`IS_INDEXABLE` is the environment flag that controls whether the site asks to be
indexed: it drives the `robots.txt` rules and the page-level
`<meta name="robots">` (`web/src/lib/env.ts`, logic in `web/src/lib/seo-robots.ts`):

| `IS_INDEXABLE` | Vercel production | Vercel preview / development | Non-Vercel host |
|---|---|---|---|
| `"false"` | blocked | blocked | blocked |
| `"true"` | indexable | **blocked** | indexable |
| unset | indexable | blocked | **blocked** |

Blocked means `robots.txt` serves `Disallow: /` and every page carries
`noindex, nofollow`, whatever its CMS `noIndex`/`noFollow` fields say. Before
launch, set it to `"false"` in the Production environment so a half-finished
site cannot be crawled. At launch, set it to `"true"` (or remove it on Vercel).
A self-hosted production must set `"true"` explicitly.

- **Command:**
  ```bash
  curl -s  $SITE/robots.txt                                  # Allow: / (not Disallow: /)
  curl -s  $SITE/ | grep -oE '<meta name="robots"[^>]*>'     # absent, or index
  curl -s  <branch-preview-url>/ | grep -oE '<meta name="robots"[^>]*>'   # noindex, nofollow
  curl -s  $PREVIEW/ | grep -oE '<link rel="canonical"[^>]*>'             # points at $SITE
  ```
- **Good:** on `$SITE`, robots allows crawling and no page (other than those
  marked `noIndex` in the CMS) carries `noindex`. Preview deployments carry
  `noindex, nofollow`.
- **Known gap:** `$PREVIEW` (the `vercel.app` alias of **production**) is a
  production deployment, so it is indexable like `$SITE`. The template sends no
  host-based `X-Robots-Tag`; the only protection is that its canonical points at
  `$SITE` (canonicals are built from `NEXT_PUBLIC_BASE_URL`). If that is not
  enough, add a `noindex` `X-Robots-Tag` header for `*.vercel.app` hosts in
  `web/src/proxy.ts`.
- **Trap:** the flag is read at build time. Changing it in Vercel does nothing
  until you redeploy.

### 2.3 Search Console

- Submit `$SITE/sitemap.xml` in Google Search Console (a Domain property,
  verified by DNS TXT, covers `www`, `http` and every path) and in Bing Webmaster
  Tools (import from Search Console).
- Use **URL Inspection → Test live URL** on the homepage and one page of each
  type. **Good:** the page is available to Google, and the canonical is the URL
  you entered.
- For two weeks after launch, check *Pages → Not found (404)*. Fix an old URL
  with a `redirect` document in the Studio. It goes live without a deploy.

---

## 3. SEO metadata: every page has a title and a description

A page with no description falls back to the Site default, so every such page
ships the **same** description. Nothing warns you about it.

- **Query** (Vision, perspective `published`): routed documents whose search
  title or description is missing or out of range. The `coalesce` order is the
  one the metadata builders use (`studio/src/sanity/lib/seo-title.ts` and each
  route's `generateMetadata`): title = `metadata.seoTitle` → `metadata.title` →
  the document's own `title`; description = `metadata.description` → `excerpt`
  (posts, case studies) → `summary` (podcast episodes).
  ```groq
  *[defined(metadata.slug.current) && !(_id in path("drafts.**")) && metadata.noIndex != true]{
    _type, _id,
    "slug": metadata.slug.current,
    "title": coalesce(metadata.seoTitle, metadata.title, title),
    "description": coalesce(metadata.description, excerpt, summary)
  }[!defined(title) || length(title) > 60
    || !defined(description) || length(description) < 50 || length(description) > 160]
  ```
  Then the Site settings fallback, and every override to confirm (one query
  at a time in Vision):
  ```groq
  *[_type == "site"][0].seo{ title, description }
  ```
  ```groq
  *[defined(metadata.slug.current) && !(_id in path("drafts.**"))
    && (metadata.noIndex == true || metadata.noFollow == true || defined(metadata.canonical))]{
    _type, "slug": metadata.slug.current,
    "noIndex": metadata.noIndex, "noFollow": metadata.noFollow, "canonical": metadata.canonical
  }
  ```
- **Good:**
  - The first query returns `[]`: every indexable document has a title of 60
    characters or fewer and a description of 50–160 characters.
  - The Site settings have an SEO title and description (the fallback for any
    page without one).
  - No two pages share a title or a description. Drop the trailing filter from
    the first query and append `| order(description)` to see repeats side by side.
  - Each `noIndex` / `noFollow` / `canonical` override is intentional. Pages with
    no share image use the generated `/api/og` card. That is fine, but
    important pages usually deserve a real image.
- **Spot-check the render**, because a stored field is not proof it reached the
  page:
  ```bash
  curl -s $SITE/some-page | grep -oE '<title>[^<]*</title>|<meta name="description"[^>]*>|<link rel="canonical"[^>]*>'
  ```
  **Good:** the title is `Page title | Site title`, not the brand twice (a title
  that already names the brand is left as is). The canonical is on `$SITE`,
  unless the page has a Canonical URL override. The Studio's **Search
  appearance** preview on the Metadata tab shows the same title — it uses the
  same function.

### 3.1 Structured data (JSON-LD) is filled in and validates

Every indexable page renders one `<script type="application/ld+json">` with a
connected `@graph` (built in `web/src/lib/schema-org/`). The Organization and
WebSite nodes come from **Site settings → Structured Data**. If that tab is
empty, the graph still renders, but the Organization is just the site title with
the header logo and no social profiles. Nothing warns you about that.

- **Check in Studio:** Site settings → Structured Data. Fill in the legal name, a
  **square** logo (the wide header logo looks poor in a knowledge panel), the
  social profile URLs (`sameAs`) and, for a business with an office, the street
  address, city and telephone. Choose the local-business type only if it is
  true: all three fields are needed before the Organization becomes that type.
  Review the "Default page types" (e.g. `CollectionPage` for the two listing
  pages).
- **Command:**
  ```bash
  # One script per page, valid JSON, and the node types you expect.
  for path in / /blog /blog/<a-post> /case-studies/<a-case-study> /<a-page-with-an-faq>; do
    echo "== $path"
    curl -s "$SITE$path" \
      | grep -o '<script type="application/ld+json">[^<]*</script>' \
      | sed -e 's/<script type="application\/ld+json">//' -e 's/<\/script>//' \
      | jq -c '[."@graph"[]."@type"]'
  done
  ```
  Then paste two or three of the URLs into Google's **Rich Results Test**
  (https://search.google.com/test/rich-results) and the **Schema Markup
  Validator** (https://validator.schema.org).
- **Good:** each URL prints exactly one array. The home page has `Organization`,
  `WebSite`, `WebPage` and `BreadcrumbList`. A post and a case study add
  `Article` (or the type chosen on their Structured Data tab) and `Person`. A page
  with an FAQ block shows `["WebPage","FAQPage"]` plus one `Question` per item.
  The validator reports **0 errors**. In the Rich Results Test, the Article and
  Breadcrumb items are detected, and every `@id` URL is on `$SITE`, not
  `localhost` or `*.vercel.app`.
- **Expected, not a bug:**
  - A `noIndex` page, and **every** page while `IS_INDEXABLE` is off (previews,
    pre-launch, local dev without `IS_INDEXABLE="true"`), renders **no** JSON-LD.
    Check on the production deployment after §2.2.
  - Google shows FAQ rich results only for a few authoritative sites, so the Rich
    Results Test may report "no items detected" for FAQ even though the
    `Question` nodes are valid. The Schema Markup Validator should still list them.

---

## 4. Content: no placeholder or test values

Template defaults, seeded demo content and "test" entries made during QA all
look like real content in the Studio.

- **Query (Vision, perspective `published`):** covers the fields where placeholders
  usually hide.
  ```groq
  *[
    !(_type match "sanity.*") && !(_type match "system.*") &&
    [
      title, name, label, metadata.title, metadata.description,
      pt::text(content), pt::text(body)
    ] match ["lorem", "ipsum", "dolor", "test", "todo", "tbd", "placeholder", "meridian", "acme", "xxx"]
  ]{ _id, _type, "slug": metadata.slug.current, title, "metaTitle": metadata.title }
  ```
  `match` compares whole words, so `"test"` does not hit "testimonial".
- **Full sweep:** the query misses nested fields (section copy, CTA labels, links), so also export the
  dataset and grep all of it:
  ```bash
  pnpm --filter @meridian/studio exec sanity dataset export $DATASET /tmp/launch-export.tar.gz --no-assets
  tar -xzOf /tmp/launch-export.tar.gz '*data.ndjson' \
    | grep -ioE '.{0,40}(lorem|ipsum|\btest\b|\btodo\b|placeholder|example\.com|google\.com|meridian|"label":"label"|"href":"#").{0,40}' \
    | sort | uniq -c | sort -rn | head -50
  ```
- **Good:** both come back empty, or every hit is a real word (such as a
  "testimonial" or a real "test" in the copy) that you have looked at and
  accepted.
- **Also check:**
  - Delete demo documents. Don't only unpublish them. That means the Meridian
    content `pnpm seed` imported (pages, posts, case studies, testimonials,
    authors) and any "Acme" client or review.
  - Social links point at the client's real profiles, not a bare
    `linkedin.com` or `google.com`.
  - Every CTA has a label and a destination. A CTA with no label can render
    literally as "Label".
  - The Studio section defaults (`studio/.../sections/*.ts` `initialValue`s) no
    longer carry the template's copy. New sections editors add after launch
    start from those defaults.
  - Links and images in the dataset: the `link-fix` skill counts links to the
    site's own domain, `http://` URLs and slash mismatches and fixes the ones
    you pick; the `generate-alts` skill lists images without alt text and
    writes the alts you approve.

---

## 5. Navigation has an active state

The header resolves the active item once per menu with `getActiveNav` in
`web/src/ui/header/utils/activeLinkUtils.ts` (used by `Navigation.tsx`,
`NavigationDropdown.tsx` and `HamburgerMenu.tsx`). A link is active on its own
page **and on every page under it**, so "Blog" is active on `/blog/<a-post>`.
When several links match, the longest path wins, so at most one item lights up.
The path matching is pure and tested in `utils/active-path.ts`.

- **Check:** click through every top-level nav item on desktop and in the
  hamburger menu. Then open a nested page, such as `/blog/<a-post>`,
  `/podcast/<an-episode>` and `/case-studies/<one>`.
- **Command** (in the browser console on each page):
  ```js
  [...document.querySelectorAll("header [aria-current]")].map((link) => [link.textContent.trim(), link.getAttribute("aria-current")])
  ```
  The active link carries `aria-current="page"` on its own page and
  `aria-current="true"` on a page under it.
- **Good:** exactly one item is highlighted on every page that is in the menu,
  and its dropdown parent is highlighted too (the desktop pill and the mobile
  accordion row).
- **Known gaps to decide on:**
  - A link to `/` is active on the home page only, never as a parent of every
    page.
  - Only `internal` and `path` links can be active. A menu item stored as an
    **external** URL pointing at the site's own domain is never highlighted.
    Re-point it at the document (the `link-fix` skill finds all of them).
  - Check once outside draft mode. Visual-editing (stega) encoding on string
    fields can break string comparisons. Wrap CMS strings used in logic with
    `stegaClean()`.

---

## 6. Sanity project settings

### 6.1 CORS origins

CORS origins and the revalidate webhook (6.2) are declared in
`sanity.blueprint.ts` (repo root). Set the production domain and apply both at once:

```bash
SANITY_BLUEPRINT_SITE_URL=$SITE SANITY_REVALIDATE_SECRET=<prod secret> pnpm blueprints:plan
SANITY_BLUEPRINT_SITE_URL=$SITE SANITY_REVALIDATE_SECRET=<prod secret> pnpm blueprints:deploy
```

Add `www` and preview origins with `SANITY_BLUEPRINT_EXTRA_ORIGINS`. Setup and
first run: [`sanity-blueprints.md`](./sanity-blueprints.md). To inspect what is
live: `pnpm --filter @meridian/studio exec sanity cors list`.

- **Needed:**
  - **The Studio's origin, with credentials.** The embedded Studio lives at
    `$SITE/admin`, so the site origin itself needs "Allow credentials". Add the
    standalone Studio host too if you deploy one.
  - **The site origin(s)** — the apex **and** `www` if both serve, plus any
    custom preview domain. Browser-side reads (visual editing, the styleguide
    admin gate, any client fetch to `*.api.sanity.io`) need it.
- **The asset CDN enforces the allowlist too.** An `<img>` from `cdn.sanity.io`
  loads from any origin. A `fetch()` of an asset (Lottie JSON, an SVG you
  inline) or a CSS `mask-image` from the CDN is CORS-gated. It fails
  **silently** from an origin that is not listed: you get an empty box, no
  console error and no broken-image glyph. `localhost` is on the allowlist, so it
  works in development and fails only in production.
- **Command:**
  ```bash
  curl -sI -H "Origin: $SITE" "https://$PROJECT_ID.api.sanity.io/v2024-10-01/data/query/$DATASET?query=*%5B0%5D%7B_id%7D" | grep -i access-control-allow
  curl -sI -H "Origin: $SITE" "<an asset URL from cdn.sanity.io used on the site>" | grep -i access-control-allow
  ```
- **Good:** both answer `access-control-allow-origin: $SITE` (the first with
  `access-control-allow-credentials: true`). Then log in to `$SITE/admin` from
  the production domain, open a page in the Presentation tool, and confirm that
  visual editing loads.

### 6.2 Revalidation webhook and tokens

- **Check:** a Sanity webhook for the **production dataset** posts to
  `$SITE/api/revalidate`. It projects `_type` and the slug, and it sends the
  `SANITY_REVALIDATE_SECRET` header (see
  [`sanity-blueprints.md`](./sanity-blueprints.md)).
  The webhook must target the real domain, not a preview URL. It is deployed
  from `sanity.blueprint.ts` (repo root) (6.1). Delete any hand-made copy in
  sanity.io/manage → API → Webhooks, or every publish revalidates twice.
- **Command:**
  ```bash
  curl -s -o /dev/null -w '%{http_code}\n' -X POST $SITE/api/revalidate-all          # 401 without the secret
  curl -s -X POST -H "x-vercel-webhook-secret: $SANITY_REVALIDATE_SECRET" $SITE/api/revalidate-all
  ```
- **Good:** 401 without the header, 200 with it. Edit and publish a page title,
  and the live page shows the change within about a minute, with no deploy.
  Check a **listing** that shows the document too (the blog grid for a post),
  not only the document's own page.
- Rotate or remove any write token used for seeding. The deployed site needs
  only `SANITY_API_READ_TOKEN`.

---

## 7. Cookie consent and analytics

### 7.1 Cookie consent is on, with the right legal links

The banner is `@c15t/nextjs` v3, mounted in `web/src/app/(frontend)/layout.tsx`
through `web/src/ui/cookie-consent/consent-manager.tsx`.

- **Check (private window, on `$SITE`):**
  - The banner appears on the first visit, and not again after a choice.
  - "Customize" opens the dialog with the categories the site uses: with
    `NEXT_PUBLIC_GTM_ID` set, Measurement and Marketing next to Necessary.
  - Before a choice, the Network tab shows no request to `googletagmanager.com`.
  - "Reject" really stops tracking: no new `collect` requests to Google in the
    Network tab.
  - The banner and dialog show links to the **real** privacy and cookie policy
    pages, and each opens (200, not 404).
- **Trap:** in c15t 2.1 (recheck after upgrades), `ConsentBanner` / `ConsentDialog` render **no** legal
  links unless you pass the keys explicitly (for example
  `legalLinks={["privacyPolicy", "cookiePolicy"]}`) **and** set the provider's
  `legalLinks` option with the hrefs. The docs say the default shows all links.
  In practice it shows none. Also set `target` explicitly: leaving it unset
  renders `target="_blank"` with no `rel`.
- **Mode:** the provider runs `offline()`: the choice is stored in the
  visitor's browser (the `c15t` cookie) and nothing is recorded on a server.
  If the client needs server-side proof of consent, that means adding a c15t
  backend (`hosted()`) first. Either way, check that the policy copy on the
  cookie page describes what really happens.
- **Good:** all four checks pass, and the policy pages list the tools that
  really load (step 7.2).

### 7.2 GTM is wired: check it outside draft mode

- **Do not judge GTM from a draft-mode tab.** Draft mode (the Studio's
  Presentation tool, or any tab that visited `/api/draft-mode/enable`) can turn
  off the consent UI and the GTM gate together. The data layer is then silently
  empty, with no error anywhere. Visit `$SITE/api/draft-mode/disable` first, or
  use a private window.
- **Check:**
  GTM loads through the consent manager, and only after the visitor allows
  measurement or marketing (`loadMode: "after-consent"` in
  `web/src/ui/cookie-consent/consent-manager.tsx`). So the id is not in the
  HTML, and before a choice there is no `gtm.js` request and no `dataLayer`.
  Accept the banner, then in the browser console on a normal (non-draft) tab:
  ```js
  window.dataLayer?.map((entry) => entry.event).filter(Boolean)   // includes "gtm.js"
  ```
- **Good:** the container id is the **client's** (`NEXT_PUBLIC_GTM_ID` is set for
  the Production environment, and the site was redeployed after it was set,
  because the value is read at build time). `dataLayer` has `gtm.js`. Google Tag
  Assistant connects, and GA4 DebugView shows a page view.
- **Also check:** the container's tags are often limited to the production
  hostname, so a submitted form's conversion event (such as `generate_lead`)
  shows up for the first time only on `$SITE`. Test one real form submission
  after the DNS switch.

---

## 8. Deploy and cache

### 8.1 After CSS changes, check the stylesheet that was served

The Vercel build cache can ship a **stale `app.css`**: the deploy succeeds, the
HTML is new, and the stylesheet is not. The chunk filename is not proof, because
it can stay the same when the content changes. Check the bytes.

- **Command:**
  ```bash
  # replace NEW_RULE with a class or token you just added, e.g. --card-muted
  for css in $(curl -s $SITE/ | grep -oE '/_next/static/[^"]+\.css' | sort -u); do
    printf '%s  ' "$css"; curl -s "$SITE$css" | grep -c 'NEW_RULE'
  done
  ```
- **Good:** at least one stylesheet counts the new rule (>0).
- **If not:** redeploy with the build cache off. In Vercel that is *Deployments →
  Redeploy →* uncheck *Use existing Build Cache*. From the CLI it is `vercel
  --prod --force`.

### 8.2 Production environment variables

```bash
pnpm --filter @meridian/web envs:validate   # locally, with production values
```

- **Good:** in Vercel's **Production** environment, `NEXT_PUBLIC_BASE_URL` is
  `$SITE` with no trailing slash, `NEXT_PUBLIC_SANITY_DATASET` is the production
  dataset, and `NEXT_PUBLIC_GTM_ID`, `SANITY_API_READ_TOKEN`,
  `SANITY_REVALIDATE_SECRET` and `IS_INDEXABLE` are set. Use the form keys
  (`RESEND_API_KEY`, `CONTACT_FORM_*`) if forms send email.
  `HTTP_BASIC_AUTH` is **removed**. It is useful while the site is in staging,
  and fatal on launch day.
- Every change needs a redeploy. These values are read at build time or at
  module scope.

### 8.3 Redirects from the old site

- **Check:** every URL on the old site that has traffic or backlinks either
  still exists or has a `redirect` document in the Studio. Take the old sitemap
  and the top pages in analytics and Search Console as the list.
- **Command:**
  ```bash
  curl -sI $SITE/<old-path> | grep -iE '^(HTTP|location)'
  curl -sI "${SITE/https:\/\//https://www.}/" | grep -iE '^(HTTP|location)'   # www -> apex (or the reverse)
  curl -sI "${SITE/https/http}/" | grep -iE '^(HTTP|location)'                 # http -> https
  ```
- **Good:** each old URL answers `308`/`301` to its new home in **one** hop, and
  only one of `www` or the apex serves pages.

---

### 8.4 Performance: measure the way PageSpeed Insights does

PageSpeed Insights is Lighthouse in its default mobile configuration (emulated
Moto G Power, slow 4G, simulated throttling). Single runs scatter by up to ten
points, so take the median of three.

- **Check:** run [PageSpeed Insights](https://pagespeed.web.dev/) on `$SITE/`
  and one page of each type, three times each, and note the median mobile
  score. Locally, the same run is Chrome DevTools → **Lighthouse** →
  *Mobile*, *Performance*, in an incognito window, or the Lighthouse CLI:
  ```bash
  npx lighthouse $SITE/ --only-categories=performance --output=html --output-path=/tmp/lh.html --view
  ```
  The report names the LCP element and its phases, and every audit that still
  has something to save.
- **Good:** median performance of 90 or more on mobile, LCP under 2.5 s.
- **If not:** start with the LCP element the report names. The usual causes
  on this site are an above-the-fold image without `preload` and
  `fetchPriority="high"` (the hero backdrop has them; a new first-module
  section needs the same; `<Image>` never preloads on its own), fonts added to
  the preloaded call in `web/src/ui/fonts.ts` (only 400/500 are preloaded, as
  Latin-subset woff2; put new weights in the non-preloaded call), and a
  third-party script loaded before the content. For CLS and INP, which
  Lighthouse only partly covers, trace in Chrome DevTools (mobile, CPU 6×,
  Slow 4G). Scores differ from PSI by a few points because
  PSI runs from Google's servers with a cold CDN cache; the audits are the same.
- **Sanity side:** the `sanity-optimizations` skill audits query size, Sanity
  reads per route, image widths and `sizes`, CDN use and caching, and
  estimates Sanity and Vercel usage at launch traffic.

## 9. Final smoke test (after the DNS switch)

```bash
curl -sI $SITE/ | head -1                          # 200
curl -sI $SITE/this-page-does-not-exist | head -1  # 404, and the CMS 404 page renders
curl -s  $SITE/robots.txt
curl -sI $SITE/sitemap.xml | head -1               # 200
curl -s  $SITE/llms.txt | head -5
```

- Open the homepage, one page of each type, the blog and one post, on mobile and
  desktop, in a private window. Check the console for errors, and look for broken
  images (a CORS or asset-domain problem) and fonts that fall back to the system
  font.
- Submit every form once and confirm the message reaches its recipient.
- Run Lighthouse or PageSpeed Insights on the homepage and one heavy page.
  Look at LCP and CLS first.
- Keep the old hosting running for a few weeks after launch, and don't delete it
  until Search Console shows no new 404s from old URLs.
