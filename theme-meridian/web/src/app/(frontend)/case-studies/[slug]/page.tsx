import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { IS_INDEXABLE } from "@/lib/env";
import { markdownPathFor } from "@/lib/markdown/negotiation";
import { toOgImage } from "@/lib/og-image";
import resolveUrl from "@/lib/resolveUrl";
import { buildRouteGraph, caseStudyGraphDocument } from "@/lib/schema-org/route-graph";
import { buildRobotsAndAlternates } from "@/lib/seo-robots";
import { buildSeoDescription, buildSeoTitle, resolveSiteTitle } from "@/lib/seo-title";
import { client } from "@/sanity/lib/client";
import { fetchSanity } from "@/sanity/lib/fetch";
import {
  CaseStudyDetailQuery,
  CaseStudySlugsQuery,
} from "@/sanity/lib/queries/case-studies";
import { fetchGlobalSections } from "@/sanity/lib/queries/global-sections";
import { getSite, getSiteSchema } from "@/sanity/lib/queries/site";
import { SANITY_TAGS, caseStudyTag } from "@/sanity/lib/tags";
import type { CaseStudyDetailQueryResult } from "@/types/sanity.types";
import { AuthorByline } from "@/ui/components/author-byline";
import { CopyMarkdownButton } from "@/ui/components/copy-markdown-button";
import Image from "@/ui/components/image";
import { StructuredData } from "@/ui/components/structured-data";
import RichText from "@/ui/RichText";
import Sections from "@/ui/sections";
import { Breadcrumb } from "@/ui/sections/CaseStudyDetail/breadcrumb";
import { MetricsCard } from "@/ui/sections/CaseStudyDetail/metrics-card";
import { MoreCaseStudies } from "@/ui/sections/CaseStudyDetail/more-case-studies";
import { QuoteBlock } from "@/ui/sections/CaseStudyDetail/quote-block";

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
const getCaseStudy = cache(async (slug: string) =>
  fetchSanity<CaseStudyDetailQueryResult>({
    query: CaseStudyDetailQuery,
    params: { slug: `case-studies/${slug}`, documentSlug: slug },
    tags: [SANITY_TAGS["case-study"], caseStudyTag(slug)],
  }),
);

const CaseStudyPage = async ({ params }: Props) => {
  const { slug } = await params;
  const caseStudy = await getCaseStudy(slug);

  if (!caseStudy) notFound();

  const publishedDate = formatDate(caseStudy.publishedAt);
  const metrics = caseStudy.metrics ?? [];
  const moreCaseStudies = caseStudy.moreCaseStudies ?? [];
  const [globals, siteSchema] = await Promise.all([
    fetchGlobalSections(`case-studies/${slug}`),
    getSiteSchema(),
  ]);
  const graph = buildRouteGraph({
    document: caseStudyGraphDocument(caseStudy, siteSchema),
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
          <Breadcrumb title={caseStudy.title ?? "Case study"} />

          <div className="flex flex-col items-center gap-7 text-center">
            <p className="flex flex-wrap items-center justify-center gap-2 text-10 leading-4 font-medium tracking-widest text-muted-foreground uppercase">
              <span>{caseStudy.eyebrow || "Case study"}</span>
              {publishedDate && (
                <>
                  <span aria-hidden>·</span>
                  <time dateTime={caseStudy.publishedAt ?? undefined}>
                    {publishedDate}
                  </time>
                </>
              )}
              {caseStudy.author && (
                <>
                  <span aria-hidden>·</span>
                  <AuthorByline author={caseStudy.author} />
                </>
              )}
            </p>

            {caseStudy.logo?.image && (
              <Image
                sanityImage={caseStudy.logo}
                className="h-11 w-auto object-contain"
                loading="eager"
              />
            )}

            <h1 className="text-36 leading-tighter font-medium tracking-tight text-balance md:text-44">
              {caseStudy.title}
            </h1>

            {caseStudy.excerpt && (
              <p className="text-18 leading-relaxed text-muted-foreground md:text-20">
                {caseStudy.excerpt}
              </p>
            )}

            <CopyMarkdownButton markdownPath={markdownPathFor(`/case-studies/${slug}`)} />
          </div>

          {metrics.length > 0 && <MetricsCard metrics={metrics} />}
        </div>

        {caseStudy.body && (
          <div className="mx-auto mt-12 max-w-3xl md:mt-16">
            <RichText value={caseStudy.body} />
          </div>
        )}
      </article>

      {caseStudy.quote && <QuoteBlock quote={caseStudy.quote} />}

      {moreCaseStudies.length > 0 && <MoreCaseStudies items={moreCaseStudies} />}

      {globals.after.length > 0 && (
        <Sections sections={globals.after} withDataFirstAttribute={false} />
      )}
    </>
  );
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const [caseStudy, site] = await Promise.all([
    getCaseStudy(slug),
    // A missing Site document must not fail the metadata build.
    getSite().catch(() => null),
  ]);

  if (!caseStudy) return { title: "Not Found" };

  // og:title is the H1, not the SEO title, so social cards read like the article.
  const ogTitle = caseStudy.title || "Case study";
  const description = buildSeoDescription({
    metadataDescription: caseStudy.metadata?.description,
    excerpt: caseStudy.excerpt,
    site,
  });
  const ogImage = caseStudy.metadata?.image?.image?.asset
    ? caseStudy.metadata.image
    : caseStudy.image;
  const url = resolveUrl({
    _type: "case-study",
    metadata: { slug: { _type: "slug", current: caseStudy.slug ?? "" } },
  });

  return {
    title: buildSeoTitle({
      metadata: caseStudy.metadata,
      documentTitle: caseStudy.title,
      site,
    }),
    description: description || undefined,
    openGraph: {
      type: "article",
      siteName: resolveSiteTitle(site),
      url,
      title: ogTitle,
      description,
      images: toOgImage(ogImage),
    },
    ...buildRobotsAndAlternates(caseStudy.metadata, url, { isIndexable: IS_INDEXABLE }),
  };
};

export const generateStaticParams = async () => {
  const slugs = await client.fetch(CaseStudySlugsQuery, {}, { perspective: "published" });

  return slugs
    .map(({ slug }) => slug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }));
};

export default CaseStudyPage;
