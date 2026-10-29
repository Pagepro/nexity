import { notFound } from "next/navigation";

import processMetadata from "@/lib/processMetadata";
import { buildRouteGraph, blogListingGraphDocument } from "@/lib/schema-org/route-graph";
import { fetchSanity } from "@/sanity/lib/fetch";
import { BlogListingPageQuery, buildBlogPostsPageQuery } from "@/sanity/lib/queries/blog";
import { fetchGlobalSections } from "@/sanity/lib/queries/global-sections";
import { getSite, getSiteSchema } from "@/sanity/lib/queries/site";
import { SANITY_TAGS } from "@/sanity/lib/tags";
import {
  BlogListingPageQueryResult,
  BlogPostsPageQueryResult,
} from "@/types/sanity.types";
import { PageSections } from "@/types/sections";
import { StructuredData } from "@/ui/components/structured-data";
import RichText from "@/ui/RichText";
import Sections from "@/ui/sections";
import FeaturedPost from "@/ui/sections/BlogListingSection/featured-post";

const SLUG = "blog";
const DEFAULT_PER_PAGE = 6;

const getPage = async () => {
  const page = await fetchSanity<BlogListingPageQueryResult>({
    query: BlogListingPageQuery,
    params: { slug: SLUG },
    tags: [SANITY_TAGS["blog-listing-page"]],
  });

  return page;
};

const BlogPage = async () => {
  const page = await getPage();

  if (!page) notFound();

  const featured = page.featuredPost;
  const excludeIds = featured?._id ? [featured._id] : [];

  const pageSections = (page.sections ?? []) as PageSections;

  const listingSection = pageSections.find(
    (section) => section?._type === "blog-listing",
  );
  const perPage =
    listingSection && "perPage" in listingSection
      ? (listingSection.perPage ?? DEFAULT_PER_PAGE)
      : DEFAULT_PER_PAGE;

  const firstPage = await fetchSanity<BlogPostsPageQueryResult>({
    query: buildBlogPostsPageQuery(0, perPage),
    params: { category: "", q: "", excludeIds },
    tags: [SANITY_TAGS.post],
  });

  const sections = pageSections.map((section) =>
    section?._type === "blog-listing"
      ? { ...section, posts: firstPage?.posts ?? [], total: firstPage?.total ?? 0 }
      : section,
  ) as PageSections;

  const [globals, siteSchema] = await Promise.all([
    fetchGlobalSections(SLUG),
    getSiteSchema(),
  ]);
  const mergedSections = [
    ...globals.before,
    ...sections,
    ...globals.after,
  ] as PageSections;
  const graph = buildRouteGraph({
    document: blogListingGraphDocument(page, siteSchema),
    site: siteSchema,
    sections: mergedSections,
  });

  return (
    <>
      <StructuredData graph={graph} />
      {page.content && (
        <section className="section py-8 md:py-12">
          <RichText value={page.content} className="mx-auto max-w-xl text-center" />
        </section>
      )}
      {featured && (
        <section className="section pb-8 md:pb-12">
          <FeaturedPost post={featured} />
        </section>
      )}
      <Sections sections={mergedSections} page={page} />
    </>
  );
};

export const generateMetadata = async () => {
  const [page, site] = await Promise.all([getPage(), getSite().catch(() => null)]);

  if (!page) return notFound();

  return processMetadata(page, site);
};

export default BlogPage;
