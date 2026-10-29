import { NextResponse } from "next/server";

import {
  buildRedirectMap,
  buildRewriteRules,
  PROXY_MEMO_CACHE_SECONDS,
} from "@/lib/redirect-map";
import { fetchRedirectEntries, fetchRewriteEntries } from "@/lib/redirects";

// An endpoint, not a Sanity read in the proxy: Next's `patchFetch` never reaches the
// proxy bundle, so a tagged fetch there is uncached and no tag can purge it.
// The payload is public: it carries only what the proxy reads. Dynamic on purpose:
// prerendering would tie the build to Sanity and could cache a failed read.
export const dynamic = "force-dynamic";

export const GET = async () => {
  let entries;
  let rewriteEntries;

  try {
    // Both or neither: a payload with one half missing would read as "none exist".
    [entries, rewriteEntries] = await Promise.all([
      fetchRedirectEntries(),
      fetchRewriteEntries(),
    ]);
  } catch (error) {
    console.error(`[redirects] read failed: ${(error as Error).message}`);

    // Never an empty table: the proxy would read it as "no redirects" and keep it.
    return new NextResponse(null, {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }

  const { exact, rules, skipped, collapsed } = buildRedirectMap(entries);
  const { rewrites, skipped: skippedRewrites } = buildRewriteRules(rewriteEntries);

  for (const [kind, list] of [
    ["redirect", skipped],
    ["rewrite", skippedRewrites],
  ] as const) {
    if (!list.length) continue;

    console.warn(
      `[redirects] ${list.length} ${kind} document(s) not applied: ${list
        .map(({ source, reason }) => `${source} (${reason})`)
        .join(", ")}`,
    );
  }

  if (collapsed.length) {
    console.warn(
      `[redirects] ${collapsed.length} chain(s) collapsed: ${collapsed
        .map(
          ({ source, via, destination }) =>
            `${source} -> ${via.join(" -> ")} -> ${destination}`,
        )
        .join(", ")}`,
    );
  }

  return NextResponse.json(
    {
      exact,
      rules,
      rewrites,
      count: Object.keys(exact).length + rules.length + rewrites.length,
    },
    {
      headers: {
        // ⚠️ The edge sits in front of the cache tag, so `s-maxage` must never exceed
        // the proxy memo (derived from PROXY_MEMO_TTL_MS). No `stale-while-revalidate`
        // for the same reason: a long edge copy hides a published redirect.
        "cache-control": `public, s-maxage=${PROXY_MEMO_CACHE_SECONDS}`,
      },
    },
  );
};
