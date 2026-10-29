import { loadMarkdown } from "@/lib/markdown/load-markdown";
import { normalizeContentPath } from "@/lib/markdown/negotiation";

// No `s-maxage`: the edge sits in front of the Data Cache, so an edge copy would
// outlive a `revalidateTag` purge. The tagged Sanity reads carry the cache.
export const dynamic = "force-dynamic";

const COMMON_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Robots-Tag": "noindex",
  "X-Content-Type-Options": "nosniff",
};

const NOT_FOUND = "# Not found\n\nNo page lives at this address.\n";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  const contentPath = normalizeContentPath((path ?? []).join("/"));

  let result: Awaited<ReturnType<typeof loadMarkdown>>;
  try {
    result = await loadMarkdown(contentPath);
  } catch (error) {
    console.error(`[markdown] could not build ${contentPath}`, error);

    return new Response("The content could not be loaded. Try again shortly.\n", {
      status: 503,
      headers: {
        ...COMMON_HEADERS,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  if (!result) {
    return new Response(NOT_FOUND, {
      status: 404,
      headers: { ...COMMON_HEADERS, "Cache-Control": "no-store" },
    });
  }

  return new Response(result.markdown, {
    headers: {
      ...COMMON_HEADERS,
      "Cache-Control": "public, max-age=300",
      Link: `<${result.canonicalUrl}>; rel="canonical"`,
    },
  });
}
