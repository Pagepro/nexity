# Usage model: Sanity and Vercel per month

`scripts/usage-estimate.mjs` implements this. Run it with the numbers you measured,
not the defaults, and say which inputs are measured and which are guessed.

## Pricing and quotas (checked 2026-10-26)

Re-check both pages before quoting a client. Sanity and Vercel have both changed their
meters in the last two years.

**Sanity** ([sanity.io/pricing](https://www.sanity.io/pricing))

| Per month | Free | Growth ($15 / seat) | Growth overage |
|---|---|---|---|
| API requests (live API, uncached) | 250k | 250k | $1 per 25k |
| API CDN requests | 1M | 1M | $1 per 250k |
| Bandwidth (API + asset CDN) | 100 GB | 100 GB | $0.30 per GB |
| Asset storage | 100 GB | 100 GB | $0.50 per GB |
| Documents | 10k | 25k | add-on |
| Datasets | 2, public only | 2, public or private | |

Free has no overage: past a quota the project is blocked or must upgrade.

API CDN facts that matter for the model ([API CDN docs](https://www.sanity.io/docs/content-lake/api-cdn)):

- POST queries to `/data/query` are cached like GETs. **Maximum POST size is 300 KB**;
  `@sanity/client` switches from GET to POST when the URL-encoded query passes 11,264
  characters.
- Authenticated requests are cached too, segmented per token. A token on a `useCdn: true`
  client (`@sanity/client` 3+) no longer forces the live API.
- `perspective: "drafts"` (or any multi-perspective array) makes `@sanity/client` drop
  the CDN and call the live API (verified in `@sanity/client` 8.9 source,
  `_prepareRequest`).
- Image and file requests to `cdn.sanity.io` count against **bandwidth**, not against
  API request quotas. Image transformation responses carry
  `cache-control: public, max-age=31536000, s-maxage=2592000` (checked with `curl -sI`).
- `auto=format` serves AVIF to browsers that accept it (since 2024-11-13); the first
  request can get WebP while AVIF is encoded in the background
  ([changelog](https://www.sanity.io/docs/changelog/690b41ac-cc92-41c3-b219-b1bcfd06379f)).

**Vercel** ([vercel.com/pricing](https://vercel.com/pricing))

| Per month | Hobby (included, hard cap) | Pro ($20, incl. $20 usage credit) |
|---|---|---|
| Edge (CDN) requests | 1M | 10M incl., then $2 / 1M |
| Fast Data Transfer | 100 GB | 1 TB incl., then $0.15 / GB |
| Function invocations | 1M | $0.60 / 1M |
| Fluid Active CPU | 4 h | $0.128 / h |
| ISR writes | 200k | $4 / 1M |
| ISR reads | 1M | $0.40 / 1M |
| Image Optimization transformations | 5k | $0.05 / 1k |
| Image Optimization cache reads | 300k | $0.40 / 1M |
| Image Optimization cache writes | 100k | $4 / 1M |
| Fast Origin Transfer | 10 GB | $0.06 / GB |

Hobby is for non-commercial use. Routing Middleware (`proxy.ts`) runs as a Vercel
Function, so each matched request is an invocation plus CPU time.

## Definitions

- **Visitors** = unique visitors **per day**. The four standard rows are 100, 500,
  1,000 and 5,000.
- **Page views / month** = visitors × pages per visit × 30.
- **Fetches per page** (F) = distinct Sanity queries one cold server render of a typical
  route makes, counted from the code (layout + page + `generateMetadata` + nested
  components), duplicates that Next does not dedupe included. In the Nexity starter a
  catch-all page makes 8 distinct queries (setup status, site, header, footer, page,
  global-before, global-after, site schema) and repeats the page query in
  `generateMetadata`.
- **Response size** = average JSON size of those responses. Measure it: run the query in
  Vision or `curl` the API and look at the byte count, or log `JSON.stringify(result).length`.
- **Cached** = routes are static/ISR, every published fetch has `next.tags` + `revalidate`,
  the webhook purges tags. Sanity is read at build time, after a publish, and on the small
  share of views that miss (`1 - hitRatio`, default 1%: cold regions, evictions, routes
  not prerendered).
- **Uncached** = every page view renders on the server and every fetch reaches Sanity
  (dynamic route, `cache: "no-store"`, `revalidate: 0`, or fetches without explicit cache
  options on a dynamic route). `--uncachedTarget=cdn` when the client keeps
  `useCdn: true`, `api` when it does not (or reads drafts).

## Formulas

```
PV                = visitors × pagesPerVisit × days
renders (cached)  = builds × routes + min(PV, publishes × purgeRoutes + PV × (1 − hitRatio))
renders (uncached)= PV
sanityQueries     = renders × F + routeHandlerCalls × 2 (× (1 − hitRatio) when cached)
sanityBandwidth   = sanityQueries × responseKb
                  + images from Sanity:
                      vercel mode: uniqueImages × variantsPerImage × originalKb
                      sanity mode: PV × imagesPerPage × (1 − browserCacheRatio) × imageKb
vercel invocations= PV × proxyPerPage + renders (cached) or PV (uncached) + routeHandlerCalls
ISR writes        = renders (cached only)
edge requests     = PV × edgeRequestsPerPage
transformations   = uniqueImages × variantsPerImage   (vercel mode; long upstream max-age)
image cache reads = PV × imagesPerPage × (1 − browserCacheRatio) − transformations
```

The cached figure is an **upper bound** for content churn: it assumes every purged route
is re-rendered with all F queries. In practice the Data Cache still holds the
fetches whose tags were not purged (the header, the footer), so a re-render after a page
publish re-reads only the page query.

## Reading the result

- At low traffic, **content churn dominates the cached scenario**: 100 publishes × 50
  routes purged is more Sanity reads than 100 visitors a day produce. Narrow tags help
  more than CDN tuning there.
- At high traffic, **only the uncached scenario breaks quotas**. With the defaults,
  5,000 visitors/day uncached is ~3.7M API CDN requests (369% of Free, ~$10 Growth
  overage) and ~107 GB bandwidth. Cached, the same traffic is under 10% of Free.
- If the uncached path hits the live API (`useCdn: false`), the Free/Growth API quota is
  250k: about 1,000 visitors/day × 3 pages × 8 queries uncached already uses it up.
- Vercel limits on Hobby are usually hit by **edge requests and image cache reads**
  long before Sanity limits; on Pro the usage stays within the $20 credit up to several
  thousand visitors a day unless images or invocations are unusual.

## Report table

Put the script's two tables in the report, plus one line per input that you changed from
the default and where the number came from (code count, Vision, analytics, guess).
