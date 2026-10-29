import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { IS_INDEXABLE } from "@/lib/env";
import { markdownPathFor } from "@/lib/markdown/negotiation";
import { toOgImage } from "@/lib/og-image";
import resolveUrl from "@/lib/resolveUrl";
import { buildRouteGraph, postGraphDocument } from "@/lib/schema-org/route-graph";
import { buildRobotsAndAlternates } from "@/lib/seo-robots";
import { buildSeoDescription, buildSeoTitle, resolveSiteTitle } from "@/lib/seo-title";
import { client } from "@/sanity/lib/client";
import { fetchSanity } from "@/sanity/lib/fetch";
import { PostDetailQuery, PostSlugsQuery } from "@/sanity/lib/queries/blog";
import { fetchGlobalSections } from "@/sanity/lib/queries/global-sections";
import { getSite, getSiteSchema } from "@/sanity/lib/queries/site";
import { SANITY_TAGS, postTag } from "@/sanity/lib/tags";
import type { PostDetailQueryResult } from "@/types/sanity.types";
import { AuthorByline } from "@/ui/components/author-byline";
import { CopyMarkdownButton } from "@/ui/components/copy-markdown-button";
import Image from "@/ui/components/image";
import { BaseLink } from "@/ui/components/Link/BaseLink";
import { StructuredData } from "@/ui/components/structured-data";
import RichText from "@/ui/RichText";
import Sections from "@/ui/sections";
import { Breadcrumb } from "@/ui/sections/BlogPostDetail/breadcrumb";
import { OtherArticles } from "@/ui/sections/BlogPostDetail/other-articles";

type Props = {
  params: Promise<{ slug: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const formatDate = (value?: string | null) =>
  value ? dateFormatter.format(new Date(value)) : null;

// Shared by the page and `generateMetadata`, also in draft mode, where Next does not dedupe it.
const getPost = cache(async (slug: string) =>
  fetchSanity<PostDetailQueryResult>({
    query: PostDetailQuery,
    params: { slug: `blog/${slug}`, documentSlug: slug },
    tags: [SANITY_TAGS.post, postTag(slug)],
  }),
);

const PostPage = async ({ params }: Props) => {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const publishedDate = formatDate(post.publishedAt);
  const [globals, siteSchema] = await Promise.all([
    fetchGlobalSections(`blog/${slug}`),
    getSiteSchema(),
  ]);
  const graph = buildRouteGraph({
    document: postGraphDocument(post, siteSchema),
    site: siteSchema,
    sections: [...globals.before, ...globals.after],
  });

  return (
    <>
      <StructuredData graph={graph} />
      {globals.before.length > 0 && (
        <Sections sections={globals.before} withDataFirstAttribute={false} />
      )}

      <article className="section py-8 md:py-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          <Breadcrumb title={post.title ?? "Article"} />

          <div className="flex flex-col items-center gap-7 text-center">
            <p className="flex flex-wrap items-center justify-center gap-2 text-10 leading-4 font-medium tracking-wider text-muted-foreground uppercase">
              <span>Blog</span>
              {publishedDate && (
                <>
                  <span aria-hidden>·</span>
                  <time dateTime={post.publishedAt ?? undefined}>{publishedDate}</time>
                </>
              )}
              {post.author && (
                <>
                  <span aria-hidden>·</span>
                  <AuthorByline author={post.author} />
                </>
              )}
            </p>

            <h1 className="text-36 leading-tight font-medium tracking-tight text-balance md:text-44">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-18 leading-relaxed text-muted-foreground md:text-20">
                {post.excerpt}
              </p>
            )}

            <CopyMarkdownButton markdownPath={markdownPathFor(`/blog/${slug}`)} />
          </div>
        </div>

        {post.coverImage?.image?.asset && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden md:mt-12">
            <Image
              sanityImage={post.coverImage}
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              className="object-cover"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        )}

        {post.body && (
          <div className="mx-auto mt-8 max-w-3xl md:mt-12">
            <RichText value={post.body} />
          </div>
        )}

        <div className="mx-auto mt-12 max-w-3xl">
          <BaseLink
            link="/blog"
            className="group inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-70"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground transition-transform group-hover:-translate-x-0.5">
              <ArrowLeft className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="text-sm font-bold">All posts</span>
          </BaseLink>
        </div>
      </article>

      <OtherArticles items={post.otherPosts ?? []} />

      {globals.after.length > 0 && (
        <Sections sections={globals.after} withDataFirstAttribute={false} />
      )}
    </>
  );
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const [post, site] = await Promise.all([
    getPost(slug),
    // A missing Site document must not fail the metadata build.
    getSite().catch(() => null),
  ]);

  if (!post) return { title: "Not Found" };

  // og:title is the H1, not the SEO title, so social cards read like the article.
  const ogTitle = post.title || "Article";
  const description = buildSeoDescription({
    metadataDescription: post.metadata?.description,
    excerpt: post.excerpt,
    site,
  });
  const ogImage = post.metadata?.image?.image?.asset
    ? post.metadata.image
    : post.coverImage;
  const url = resolveUrl({
    _type: "post",
    metadata: { slug: { _type: "slug", current: post.slug ?? "" } },
  });

  return {
    title: buildSeoTitle({ metadata: post.metadata, documentTitle: post.title, site }),
    description: description || undefined,
    openGraph: {
      type: "article",
      siteName: resolveSiteTitle(site),
      url,
      title: ogTitle,
      description,
      images: toOgImage(ogImage),
    },
    ...buildRobotsAndAlternates(post.metadata, url, { isIndexable: IS_INDEXABLE }),
  };
};

export const generateStaticParams = async () => {
  const slugs = await client.fetch(PostSlugsQuery, {}, { perspective: "published" });

  return slugs
    .map(({ slug }) => slug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }));
};

export default PostPage;
