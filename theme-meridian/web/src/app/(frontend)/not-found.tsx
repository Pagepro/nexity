import type { Metadata } from "next";

import { buildSeoTitle } from "@/lib/seo-title";
import { fetchSanity } from "@/sanity/lib/fetch";
import { fetchGlobalSections } from "@/sanity/lib/queries/global-sections";
import { getSite } from "@/sanity/lib/queries/site";
import { SANITY_TAGS, pageTag } from "@/sanity/lib/tags";
import type { NotFoundQueryResult } from "@/types/sanity.types";
import Sections from "@/ui/sections";

import { NotFoundQuery } from "./query";

const NOT_FOUND_SLUG = "404";

async function get404() {
  const response = await fetchSanity<NotFoundQueryResult>({
    query: NotFoundQuery,
    params: {
      slug: NOT_FOUND_SLUG,
    },
    tags: [SANITY_TAGS.page, pageTag(NOT_FOUND_SLUG), SANITY_TAGS["global-section"]],
  });

  return response;
}

export async function generateMetadata(): Promise<Metadata> {
  const [page, site] = await Promise.all([
    get404(),
    // Next prerenders this route at build, where getSite() throws without a Site document.
    getSite().catch(() => null),
  ]);

  // `robots: null`: Next already emits noindex for not-found renders, so any robots
  // value here (or the layout's fallback) would print a second robots tag.
  return {
    title: buildSeoTitle({
      metadata: page?.metadata,
      documentTitle: page?.title || "Page not found",
      site,
    }),
    description: page?.metadata?.description || undefined,
    robots: null,
  };
}

const NotFound = async () => {
  const page = await get404();

  if (!page)
    return (
      <h1 className="section flex min-h-[50vh] items-center justify-center text-36 leading-tight font-medium tracking-tight md:text-44">
        404
      </h1>
    );

  const globals = await fetchGlobalSections(NOT_FOUND_SLUG);

  return (
    <Sections
      sections={[...globals.before, ...(page.sections ?? []), ...globals.after]}
      page={page}
    />
  );
};

export default NotFound;
