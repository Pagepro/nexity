import { NextRequest } from "next/server";
import assert from "node:assert/strict";
import test from "node:test";

import proxy from "./proxy.ts";

/**
 * The Markdown branch of `proxy.ts` against a stubbed `/api/redirects` table:
 * redirects and rewrites run on the page's path, then the request is rewritten
 * to `/api/markdown/<path>`.
 */
const ORIGIN = "http://localhost:3000";
const ROUTING_TABLE = {
  exact: {
    "/old": { destination: "/new", permanent: true },
    "/away": { destination: "https://other.example/x", permanent: false },
  },
  rules: [],
  rewrites: [
    { source: "/alias", destination: "/pricing" },
    { source: "/external", destination: "https://external.example/" },
  ],
};

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url.endsWith("/api/redirects")) return Response.json(ROUTING_TABLE);

  return new Response("<html>external</html>", {
    headers: { "content-type": "text/html" },
  });
}) as typeof fetch;

const request = (path: string, accept?: string, method = "GET") =>
  proxy(
    new NextRequest(`${ORIGIN}${path}`, { method, headers: accept ? { accept } : {} }),
  );

const rewriteOf = (response: Response) => response.headers.get("x-middleware-rewrite");

test(".md and Accept: text/markdown rewrite to the Markdown route", async () => {
  assert.equal(rewriteOf(await request("/pricing.md")), `${ORIGIN}/api/markdown/pricing`);
  assert.equal(rewriteOf(await request("/index.md")), `${ORIGIN}/api/markdown`);
  assert.equal(
    rewriteOf(await request("/blog/post", "text/markdown")),
    `${ORIGIN}/api/markdown/blog/post`,
  );
});

test("a browser request and a POST are left alone", async () => {
  const browser = await request("/pricing", "text/html,application/xhtml+xml,*/*;q=0.8");
  assert.equal(rewriteOf(browser), null);
  assert.equal(browser.headers.get("x-middleware-next"), "1");

  const post = await request("/pricing.md", undefined, "POST");
  assert.equal(rewriteOf(post), null);
});

test("a redirect on this site keeps the .md; through Accept it is the plain redirect", async () => {
  const suffix = await request("/old.md");
  assert.equal(suffix.status, 308);
  assert.equal(suffix.headers.get("location"), `${ORIGIN}/new.md`);

  const negotiated = await request("/old", "text/markdown");
  assert.equal(negotiated.status, 308);
  assert.equal(negotiated.headers.get("location"), `${ORIGIN}/new`);

  const external = await request("/away.md");
  assert.equal(external.status, 307);
  assert.equal(external.headers.get("location"), "https://other.example/x");
});

test("an internal rewrite serves its destination's Markdown; an external one has none", async () => {
  assert.equal(rewriteOf(await request("/alias.md")), `${ORIGIN}/api/markdown/pricing`);

  const external = await request("/external.md");
  assert.equal(external.status, 404);
  assert.equal(external.headers.get("content-type"), "text/markdown; charset=utf-8");

  const negotiated = await request("/external", "text/markdown");
  assert.equal(rewriteOf(negotiated), "https://external.example/");
});
