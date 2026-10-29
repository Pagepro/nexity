import { defineQuery } from "groq";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import processMetadata from "@/lib/processMetadata";
import { buildRouteGraph, pageGraphDocument } from "@/lib/schema-org/route-graph";
import { client } from "@/sanity/lib/client";
import { fetchSanity } from "@/sanity/lib/fetch";
import { fetchGlobalSections } from "@/sanity/lib/queries/global-sections";
import { getSite, getSiteSchema } from "@/sanity/lib/queries/site";
import { SANITY_TAGS, pageTag } from "@/sanity/lib/tags";
import type { PageQueryResult, PageSlugsQueryResult } from "@/types/sanity.types";
import { StructuredData } from "@/ui/components/structured-data";
import Sections from "@/ui/sections";

import { PageQuery } from "./query";

// If you add any document types that have to use the catchall route - you need to update query
const PageSlugsQuery = defineQuery(`*[
  _type == 'page' && defined(metadata.slug.current)
].metadata.slug.current`);

// Only where the webhook purges `page`: elsewhere a page published after the list was cached
// would 404 until the 30-day revalidate.
const GUARD_UNKNOWN_SLUGS =
  process.env.VERCEL_ENV === "production" &&
  Boolean(process.env.SANITY_REVALIDATE_SECRET);

function processSlug(params: Params) {
  if (!params.slug?.length)
    return {
      slug: "/",
    };

  const slug = params.slug.join("/");

  return { slug };
}

// A path no page has (a scanner probing `/wp-login`) is answered from one cached slug list
// instead of a ~200 KB page query per path.
const isKnownSlug = async (slug: string) => {
  if (!GUARD_UNKNOWN_SLUGS || (await draftMode()).isEnabled) return true;

  const slugs = await fetchSanity<PageSlugsQueryResult>({
    query: PageSlugsQuery,
    tags: [SANITY_TAGS.page],
  });

  return slugs.includes(slug);
};

// `cache`: the page and `generateMetadata` share one read, also in draft mode, where Next
// does not dedupe the POST.
const getPage = cache(async (slug: string) => {
  if (!(await isKnownSlug(slug))) return null;

  return fetchSanity<PageQueryResult>({
    query: PageQuery,
    params: { slug },
    tags: [SANITY_TAGS.page, pageTag(slug)],
  });
});

const Page = async ({ params }: Props) => {
  const { slug } = processSlug(await params);
  const page = await getPage(slug);

  if (!page) notFound();

  const [globals, siteSchema] = await Promise.all([
    fetchGlobalSections(slug),
    getSiteSchema(),
  ]);
  const sections = [...globals.before, ...(page.sections ?? []), ...globals.after];
  const graph = buildRouteGraph({
    document: pageGraphDocument(page, siteSchema),
    site: siteSchema,
    sections,
  });

  return (
    <>
      <StructuredData graph={graph} />
      <Sections sections={sections} page={page} />
    </>
  );
};

export async function generateMetadata({ params }: Props) {
  const [page, site] = await Promise.all([
    getPage(processSlug(await params).slug),
    // No Site settings yet (fresh dataset) must not crash the metadata build.
    getSite().catch(() => null),
  ]);

  if (!page) {
    return notFound();
  }

  return processMetadata(page, site);
}

export async function generateStaticParams() {
  const slugs = await client.fetch<PageSlugsQueryResult>(
    PageSlugsQuery,
    {},
    { perspective: "published" },
  );

  return slugs.map((slug) => ({ slug: slug === "/" ? [] : slug.split("/") }));
}

type Params = { slug?: string[] };

type Props = {
  params: Promise<Params>;
};

export default Page;
