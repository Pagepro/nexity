#!/usr/bin/env node
// Model: ../references/usage-model.md. Prices and quotas were read from the vendors' pricing
// pages on PRICING_CHECKED; re-check before quoting numbers to a client.

const PRICING_CHECKED = "2026-10-26";

const SANITY = {
  source: "https://www.sanity.io/pricing",
  free: { apiRequests: 250_000, cdnRequests: 1_000_000, bandwidthGb: 100, documents: 10_000 },
  growth: {
    apiRequests: 250_000,
    cdnRequests: 1_000_000,
    bandwidthGb: 100,
    documents: 25_000,
    seatUsd: 15,
    // Overage (Growth only; Free has no overage, it is capped).
    apiPer25kUsd: 1,
    cdnPer250kUsd: 1,
    bandwidthPerGbUsd: 0.3,
  },
};

const VERCEL = {
  source: "https://vercel.com/pricing",
  hobby: {
    edgeRequests: 1_000_000,
    fastDataTransferGb: 100,
    functionInvocations: 1_000_000,
    isrWrites: 200_000,
    isrReads: 1_000_000,
    imageTransformations: 5_000,
    imageCacheReads: 300_000,
    imageCacheWrites: 100_000,
  },
  // Pro: $20/month incl. $20 usage credit; "starting at" overage rates.
  pro: {
    baseUsd: 20,
    edgeRequestsIncluded: 10_000_000,
    edgePer1MUsd: 2,
    fastDataTransferIncludedGb: 1_000,
    fdtPerGbUsd: 0.15,
    invocationsPer1MUsd: 0.6,
    isrWritesPer1MUsd: 4,
    isrReadsPer1MUsd: 0.4,
    transformationsPer1kUsd: 0.05,
    imageCacheReadsPer1MUsd: 0.4,
    imageCacheWritesPer1MUsd: 4,
  },
};

const DEFAULTS = {
  visitors: "100,500,1000,5000", // unique visitors PER DAY
  pagesPerVisit: 3,
  days: 30,
  fetchesPerPage: 8, // Sanity queries one cold server render makes (layout + page + metadata)
  hitRatio: 0.99, // "cached" scenario: share of page views served without a server render
  responseKb: 30, // average Sanity query response size
  routes: 50, // prerendered routes (pages + posts + ...)
  builds: 20, // deploys per month (each prerenders every route)
  publishes: 100, // publishes per month
  purgeRoutes: 50, // routes one publish invalidates (the starter's `page` tag purges every page)
  uncachedTarget: "cdn", // "cdn" (useCdn: true) or "api" (useCdn: false / drafts / token-only)
  imageMode: "vercel", // "vercel" (/_next/image) or "sanity" (custom loader to cdn.sanity.io)
  imagesPerPage: 6,
  imageKb: 80, // average optimized image actually delivered
  originalKb: 600, // average original asset size (what Vercel pulls from Sanity on a miss)
  uniqueImages: 300, // distinct images on the site
  variantsPerImage: 6, // widths x formats x qualities actually requested per image
  browserCacheRatio: 0.5, // share of image requests answered by the browser cache
  edgeRequestsPerPage: 25, // HTML + JS + CSS + fonts + images per page view
  pageKb: 500, // HTML + JS + CSS per page view (images excluded)
  proxyPerPage: 1, // proxy/middleware invocations per page view (0 when there is none)
  apiCallsPerPage: 0.1, // route-handler calls per page view (listing filters, search, forms)
};

const parseArgs = (argv) => {
  const out = { ...DEFAULTS, json: false };
  for (const arg of argv.slice(2)) {
    if (arg === "--json") out.json = true;
    else if (arg === "--help" || arg === "-h") out.help = true;
    else {
      const m = /^--([a-zA-Z]+)=(.*)$/.exec(arg);
      if (!m || !(m[1] in DEFAULTS)) throw new Error(`Unknown argument: ${arg}`);
      out[m[1]] = typeof DEFAULTS[m[1]] === "number" ? Number(m[2]) : m[2];
    }
  }
  return out;
};

const estimate = (o, visitorsPerDay, scenario) => {
  const pageViews = visitorsPerDay * o.pagesPerVisit * o.days;
  const cached = scenario === "cached";

  // Cached: builds prerender every route, purged routes re-render once (capped at page views),
  // and (1 - hitRatio) of views still miss (cold regions, evictions).
  const buildRenders = o.builds * o.routes;
  const missRenders = Math.min(pageViews, o.publishes * o.purgeRoutes + pageViews * (1 - o.hitRatio));
  const renders = cached ? buildRenders + missRenders : pageViews;

  // Route handlers read through the Data Cache when cached.
  const apiCalls = pageViews * o.apiCallsPerPage;
  const sanityQueries = renders * o.fetchesPerPage + (cached ? apiCalls * (1 - o.hitRatio) : apiCalls) * 2;

  const toApi = !cached && o.uncachedTarget === "api";
  const cdnRequests = toApi ? 0 : sanityQueries;
  const apiRequests = toApi ? sanityQueries : 0;
  const queryGb = (sanityQueries * o.responseKb) / 1024 / 1024;

  const imageRequests = pageViews * o.imagesPerPage * (1 - o.browserCacheRatio);
  let imageSanityGb;
  let transformations = 0;
  let imageCacheReads = 0;
  let imageVercelGb = 0;
  if (o.imageMode === "vercel") {
    transformations = o.uniqueImages * o.variantsPerImage; // one per variant per month (long upstream max-age)
    imageCacheReads = Math.max(imageRequests - transformations, 0);
    imageSanityGb = (transformations * o.originalKb) / 1024 / 1024;
    imageVercelGb = (imageRequests * o.imageKb) / 1024 / 1024;
  } else {
    imageSanityGb = (imageRequests * o.imageKb) / 1024 / 1024;
  }

  const sanityBandwidthGb = queryGb + imageSanityGb;

  const invocations = pageViews * o.proxyPerPage + (cached ? renders : pageViews) + apiCalls;
  const isrWrites = cached ? renders : 0;
  const edgeRequests = pageViews * o.edgeRequestsPerPage;
  const fastDataTransferGb = (pageViews * o.pageKb) / 1024 / 1024 + imageVercelGb;

  const g = SANITY.growth;
  const growthOverageUsd =
    (Math.max(apiRequests - g.apiRequests, 0) / 25_000) * g.apiPer25kUsd +
    (Math.max(cdnRequests - g.cdnRequests, 0) / 250_000) * g.cdnPer250kUsd +
    Math.max(sanityBandwidthGb - g.bandwidthGb, 0) * g.bandwidthPerGbUsd;

  const f = SANITY.free;
  const freeFits =
    apiRequests <= f.apiRequests && cdnRequests <= f.cdnRequests && sanityBandwidthGb <= f.bandwidthGb;

  const p = VERCEL.pro;
  const proUsageUsd =
    (Math.max(edgeRequests - p.edgeRequestsIncluded, 0) / 1e6) * p.edgePer1MUsd +
    Math.max(fastDataTransferGb - p.fastDataTransferIncludedGb, 0) * p.fdtPerGbUsd +
    (invocations / 1e6) * p.invocationsPer1MUsd +
    (isrWrites / 1e6) * p.isrWritesPer1MUsd +
    (transformations / 1e3) * p.transformationsPer1kUsd +
    (imageCacheReads / 1e6) * p.imageCacheReadsPer1MUsd;

  const h = VERCEL.hobby;
  const hobbyOver = [
    edgeRequests > h.edgeRequests && "edge requests",
    fastDataTransferGb > h.fastDataTransferGb && "data transfer",
    invocations > h.functionInvocations && "invocations",
    isrWrites > h.isrWrites && "ISR writes",
    transformations > h.imageTransformations && "image transformations",
    imageCacheReads > h.imageCacheReads && "image cache reads",
  ].filter(Boolean);

  return {
    visitorsPerDay,
    scenario,
    pageViews,
    renders,
    cdnRequests,
    apiRequests,
    sanityBandwidthGb,
    pctFreeCdn: cdnRequests / f.cdnRequests,
    pctFreeApi: apiRequests / f.apiRequests,
    pctFreeBandwidth: sanityBandwidthGb / f.bandwidthGb,
    freeFits,
    growthOverageUsd,
    edgeRequests,
    invocations,
    isrWrites,
    transformations,
    imageCacheReads,
    fastDataTransferGb,
    proUsageUsd,
    hobbyOver,
  };
};

const fmt = (n) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : `${Math.round(n)}`;
const pct = (x) => `${(x * 100).toFixed(x < 0.1 ? 1 : 0)}%`;
const gb = (x) => `${x.toFixed(x < 10 ? 2 : 0)} GB`;
const usd = (x) => `$${x.toFixed(2)}`;

const main = () => {
  const o = parseArgs(process.argv);
  if (o.help) {
    console.log(
      "Usage: node .agents/skills/sanity-optimizations/scripts/usage-estimate.mjs [--flag=value ...]\n",
    );
    console.log("Flags (defaults):");
    for (const [k, v] of Object.entries(DEFAULTS)) console.log(`  --${k}=${v}`);
    console.log("  --json");
    return;
  }
  const visitors = String(o.visitors).split(",").map(Number);
  const rows = visitors.flatMap((v) => [estimate(o, v, "cached"), estimate(o, v, "uncached")]);

  if (o.json) {
    console.log(JSON.stringify({ inputs: o, pricingChecked: PRICING_CHECKED, rows }, null, 2));
    return;
  }

  console.log(
    `Inputs: ${o.pagesPerVisit} pages/visit, ${o.days} days, ${o.fetchesPerPage} Sanity queries per cold render, ` +
      `hit ratio ${o.hitRatio} (cached), ${o.responseKb} KB/response, uncached → ${o.uncachedTarget}, ` +
      `images via ${o.imageMode}, ${o.imagesPerPage} images/page, ${o.routes} routes, ${o.builds} builds, ` +
      `${o.publishes} publishes x ${o.purgeRoutes} purged routes.\n`,
  );
  console.log("### Sanity (per month)\n");
  console.log(
    "| Visitors/day | Scenario | Page views | Server renders | API CDN req | API req | Bandwidth | Free quota used (CDN / API / BW) | Growth overage |",
  );
  console.log("|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    console.log(
      `| ${r.visitorsPerDay} | ${r.scenario} | ${fmt(r.pageViews)} | ${fmt(r.renders)} | ${fmt(r.cdnRequests)} | ${fmt(r.apiRequests)} | ${gb(r.sanityBandwidthGb)} | ${pct(r.pctFreeCdn)} / ${pct(r.pctFreeApi)} / ${pct(r.pctFreeBandwidth)}${r.freeFits ? "" : " **over**"} | ${usd(r.growthOverageUsd)} |`,
    );
  }
  console.log("\n### Vercel (per month)\n");
  console.log(
    "| Visitors/day | Scenario | Edge requests | Function invocations | ISR writes | Image transformations | Image cache reads | Data transfer | Pro usage (before $20 credit) | Over Hobby limits |",
  );
  console.log("|---|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    console.log(
      `| ${r.visitorsPerDay} | ${r.scenario} | ${fmt(r.edgeRequests)} | ${fmt(r.invocations)} | ${fmt(r.isrWrites)} | ${fmt(r.transformations)} | ${fmt(r.imageCacheReads)} | ${gb(r.fastDataTransferGb)} | ${usd(r.proUsageUsd)} | ${r.hobbyOver.join(", ") || "none"} |`,
    );
  }
  console.log(
    `\nPrices and quotas checked ${PRICING_CHECKED}: ${SANITY.source}, ${VERCEL.source}. Estimates, not invoices.`,
  );
};

main();
