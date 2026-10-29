import { NextResponse, type NextRequest, type MiddlewareConfig } from "next/server";

import { authenticationErrorHtml, isAuthenticated } from "./lib/authentication";
import {
  markdownPathFor,
  markdownRequestFor,
  markdownRoutePathFor,
  normalizeContentPath,
  type MarkdownRequest,
} from "./lib/markdown/negotiation";
import { createRedirectLoader } from "./lib/redirect-loader";
import {
  matchRedirect,
  matchRewrite,
  PROXY_MEMO_TTL_MS,
  PROXY_RETRY_MS,
  type RedirectTable,
  type RewriteRule,
} from "./lib/redirect-map";

// A `fetch` from the proxy is never served by the Data Cache, so the table is memoised here;
// `PROXY_MEMO_TTL_MS` is the propagation delay editors see. Vercel runs the proxy before its
// cache, so a cached HTML page is never served to a Markdown request.

// A protected Vercel preview challenges the proxy's own read of `/api/redirects` too (it
// would get a login page and serve no redirects); the automation bypass secret gets through.
const bypassHeaders = (): Record<string, string> => {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

  return secret
    ? { "x-vercel-protection-bypass": secret, "x-vercel-set-bypass-cookie": "false" }
    : {};
};

// Dev compiles the route on its first hit, which can outlast the production budget.
const READ_TIMEOUT_MS = process.env.NODE_ENV === "production" ? 2_000 : 10_000;

interface RoutingTable extends RedirectTable {
  rewrites: RewriteRule[];
}

const readRedirects = async (origin: string): Promise<RoutingTable> => {
  const response = await fetch(`${origin}/api/redirects`, {
    // No `cache-control: no-cache` on purpose: the edge copy is safe only while the endpoint's
    // `s-maxage` equals this memo's window.
    cache: "no-store",
    headers: bypassHeaders(),
    signal: AbortSignal.timeout(READ_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  const { exact, rules, rewrites } = (await response.json()) as Partial<RoutingTable>;

  return { exact: exact ?? {}, rules: rules ?? [], rewrites: rewrites ?? [] };
};

// Created on the first request: the origin is only known then.
let loadRedirects: (() => Promise<RoutingTable | null>) | null = null;

const loadTable = (origin: string): Promise<RoutingTable | null> => {
  loadRedirects ??= createRedirectLoader({
    read: () => readRedirects(origin),
    now: Date.now,
    ttlMs: PROXY_MEMO_TTL_MS,
    retryMs: PROXY_RETRY_MS,
    onError: (error) =>
      console.error(`[proxy] redirect table unavailable: ${(error as Error).message}`),
  });

  return loadRedirects();
};

// `pathname` overrides the request's own for a Markdown request (`/x.md` → page `/x`).
const redirectFor = (
  request: NextRequest,
  table: RedirectTable,
  pathname = request.nextUrl.pathname,
): NextResponse | null => {
  const { searchParams, origin } = request.nextUrl;
  const target = matchRedirect(table, pathname, searchParams);
  if (!target) return null;

  let destination: URL;

  try {
    destination = new URL(target.destination, origin);
  } catch {
    console.warn(`[proxy] unusable redirect destination: ${target.destination}`);

    return null;
  }

  // A pattern rule can still synthesize a self-redirect the build pass never saw.
  if (destination.origin === origin && destination.pathname === pathname) {
    console.warn(`[proxy] self-redirect suppressed: ${pathname}`);

    return null;
  }

  searchParams.forEach((value, key) => {
    if (!destination.searchParams.has(key)) destination.searchParams.append(key, value);
  });

  return NextResponse.redirect(destination, target.permanent ? 308 : 307);
};

// Next forwards the request to an external rewrite host as-is, which would leak the session
// cookies (draft mode, consent) and the basic-auth credentials.
const PRIVATE_REQUEST_HEADERS = ["cookie", "authorization"];

const rewriteFor = (request: NextRequest, table: RoutingTable): NextResponse | null => {
  const { pathname, searchParams, origin } = request.nextUrl;
  const target = matchRewrite(table.rewrites, pathname, searchParams);
  if (!target) return null;

  let destination: URL;

  try {
    destination = new URL(target, origin);
  } catch {
    console.warn(`[proxy] unusable rewrite destination: ${target}`);

    return null;
  }

  if (destination.protocol !== "https:" && destination.protocol !== "http:") {
    console.warn(`[proxy] rewrite destination is not a web URL: ${target}`);

    return null;
  }

  const isInternal = destination.origin === origin;

  if (isInternal && destination.pathname === pathname) return null;

  searchParams.forEach((value, key) => {
    if (!destination.searchParams.has(key)) destination.searchParams.append(key, value);
  });

  if (isInternal) return NextResponse.rewrite(destination);

  // Overriding the request headers replaces the whole set, so deleted ones are not sent.
  const headers = new Headers(request.headers);

  for (const name of PRIVATE_REQUEST_HEADERS) headers.delete(name);

  return NextResponse.rewrite(destination, { request: { headers } });
};

const markdownNotFound = () =>
  new NextResponse("# Not found\n\nNo page lives at this address.\n", {
    status: 404,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });

// An internal redirect keeps the `.md` suffix (an `Accept` client resends its header). An
// external rewrite has no Markdown: 404 for `.md`, the normal rewrite for `Accept`.
const markdownResponseFor = (
  request: NextRequest,
  markdown: MarkdownRequest,
  table: RoutingTable | null,
): NextResponse => {
  const { origin } = request.nextUrl;
  let contentPath = markdown.contentPath;

  if (table) {
    const redirect = redirectFor(request, table, contentPath);
    if (redirect) {
      const location = redirect.headers.get("location");
      const destination = location ? new URL(location, origin) : null;
      if (markdown.via === "suffix" && destination?.origin === origin) {
        destination.pathname = markdownPathFor(destination.pathname);

        return NextResponse.redirect(destination, redirect.status);
      }

      return redirect;
    }

    const rewrite = matchRewrite(
      table.rewrites,
      contentPath,
      request.nextUrl.searchParams,
    );
    if (rewrite) {
      let destination: URL | null = null;
      try {
        destination = new URL(rewrite, origin);
      } catch {
        destination = null;
      }

      if (destination?.origin === origin) {
        contentPath = normalizeContentPath(destination.pathname);
      } else if (markdown.via === "suffix") {
        return markdownNotFound();
      } else {
        return rewriteFor(request, table) ?? NextResponse.next();
      }
    }
  }

  return NextResponse.rewrite(new URL(markdownRoutePathFor(contentPath), origin));
};

export default async function proxy(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return new NextResponse(authenticationErrorHtml, {
      status: 401,
      headers: {
        "WWW-Authenticate": "Basic",
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  const table = await loadTable(request.nextUrl.origin);
  const markdown =
    request.method === "GET" || request.method === "HEAD"
      ? markdownRequestFor(request.nextUrl.pathname, request.headers.get("accept"))
      : null;
  if (markdown) return markdownResponseFor(request, markdown, table);

  if (!table) return NextResponse.next();

  return redirectFor(request, table) ?? rewriteFor(request, table) ?? NextResponse.next();
}

export const config: MiddlewareConfig = {
  // `api` excluded so the proxy can't recurse into `/api/redirects`. Keep in sync with
  // `studio/src/sanity/lib/reserved-paths.ts`, which refuses sources under these paths.
  matcher: ["/((?!favicon.ico|_next|api|admin|cdn-sanity).*)"],
};
