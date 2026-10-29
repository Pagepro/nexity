import { ArrowLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { IS_INDEXABLE } from "@/lib/env";
import { markdownPathFor } from "@/lib/markdown/negotiation";
import { toOgImage } from "@/lib/og-image";
import resolveUrl from "@/lib/resolveUrl";
import {
  buildRouteGraph,
  podcastEpisodeGraphDocument,
} from "@/lib/schema-org/route-graph";
import { buildRobotsAndAlternates } from "@/lib/seo-robots";
import { buildSeoDescription, buildSeoTitle, resolveSiteTitle } from "@/lib/seo-title";
import { client } from "@/sanity/lib/client";
import { fetchSanity } from "@/sanity/lib/fetch";
import { fetchGlobalSections } from "@/sanity/lib/queries/global-sections";
import {
  PodcastEpisodeDetailQuery,
  PodcastEpisodeSlugsQuery,
} from "@/sanity/lib/queries/podcast";
import { getSite, getSiteSchema } from "@/sanity/lib/queries/site";
import { SANITY_TAGS, podcastEpisodeTag } from "@/sanity/lib/tags";
import type { PodcastEpisodeDetailQueryResult } from "@/types/sanity.types";
import { AuthorByline } from "@/ui/components/author-byline";
import { CopyMarkdownButton } from "@/ui/components/copy-markdown-button";
import { BaseLink } from "@/ui/components/Link/BaseLink";
import { StructuredData } from "@/ui/components/structured-data";
import RichText from "@/ui/RichText";
import Sections from "@/ui/sections";
import { ChapterList } from "@/ui/sections/PodcastListingSection/chapter-list";
import EpisodeRow from "@/ui/sections/PodcastListingSection/episode-row";
import { PlatformLinks } from "@/ui/sections/PodcastListingSection/platform-links";
import {
  formatDuration,
  formatEpisodeMeta,
} from "@/ui/sections/PodcastListingSection/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

// Shared by the page and `generateMetadata`, also in draft mode, where Next does not dedupe it.
const getEpisode = cache(async (slug: string) =>
  fetchSanity<PodcastEpisodeDetailQueryResult>({
    query: PodcastEpisodeDetailQuery,
    params: { slug: `podcast/${slug}`, documentSlug: slug },
    tags: [SANITY_TAGS["podcast-episode"], podcastEpisodeTag(slug)],
  }),
);

const EpisodePage = async ({ params }: Props) => {
  const { slug } = await params;
  const episode = await getEpisode(slug);

  if (!episode) notFound();

  const [globals, siteSchema] = await Promise.all([
    fetchGlobalSections(`podcast/${slug}`),
    getSiteSchema(),
  ]);
  const graph = buildRouteGraph({
    document: podcastEpisodeGraphDocument(episode, siteSchema),
    site: siteSchema,
    sections: [...globals.before, ...globals.after],
  });

  const metaParts = [
    episode.show?.title,
    formatEpisodeMeta(episode.episodeNumber, episode.publishedAt),
    formatDuration(episode.durationMinutes),
  ].filter((part): part is string => Boolean(part));
  const links = episode.platformLinks?.length
    ? episode.platformLinks
    : episode.show?.platformLinks;
  const chapters = episode.chapters ?? [];
  const otherEpisodes = episode.otherEpisodes ?? [];

  return (
    <>
      <StructuredData graph={graph} />
      {globals.before.length > 0 && (
        <Sections sections={globals.before} withDataFirstAttribute={false} />
      )}

      <article className="section py-8 md:py-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center justify-center gap-1.5 text-14 text-muted-foreground"
          >
            <BaseLink link="/" className="transition-colors hover:text-foreground">
              Home
            </BaseLink>
            <ChevronRight className="size-3.5 shrink-0" aria-hidden />
            <BaseLink link="/podcast" className="transition-colors hover:text-foreground">
              Podcast
            </BaseLink>
            <ChevronRight className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate text-foreground" aria-current="page">
              {episode.title ?? "Episode"}
            </span>
          </nav>

          <div className="flex flex-col items-center gap-7 text-center">
            <p className="flex flex-wrap items-center justify-center gap-2 text-10 leading-4 font-medium tracking-wider text-muted-foreground uppercase">
              {metaParts.map((part, index) => (
                <span key={part} className="contents">
                  {index > 0 && <span aria-hidden>·</span>}
                  <span>{part}</span>
                </span>
              ))}
              {episode.guest && (
                <>
                  <span aria-hidden>·</span>
                  <AuthorByline author={episode.guest} label="With" />
                </>
              )}
              {episode.show?.host && (
                <>
                  <span aria-hidden>·</span>
                  <AuthorByline author={episode.show.host} label="Hosted by" />
                </>
              )}
            </p>

            <h1 className="text-36 leading-tight font-medium tracking-tight text-balance md:text-44">
              {episode.title}
            </h1>

            {episode.summary && (
              <p className="text-18 leading-relaxed text-muted-foreground md:text-20">
                {episode.summary}
              </p>
            )}

            <PlatformLinks links={links} className="justify-center" />

            <CopyMarkdownButton markdownPath={markdownPathFor(`/podcast/${slug}`)} />
          </div>
        </div>

        {chapters.length > 0 && (
          <div className="mx-auto mt-12 max-w-3xl">
            <div className="rounded-lg bg-card-muted p-6">
              <p className="pretitle">Chapters</p>
              <div className="mt-4 text-16">
                <ChapterList chapters={chapters} className="gap-y-2" />
              </div>
            </div>
          </div>
        )}

        {episode.showNotes && (
          <div className="mx-auto mt-8 max-w-3xl md:mt-12">
            <RichText value={episode.showNotes} />
          </div>
        )}

        {episode.transcript && (
          <details className="mx-auto mt-8 max-w-3xl border-t border-border pt-8 md:mt-12">
            <summary className="cursor-pointer text-16 font-medium text-foreground">
              Transcript
            </summary>
            <div className="mt-6">
              <RichText value={episode.transcript} />
            </div>
          </details>
        )}

        <div className="mx-auto mt-12 max-w-3xl">
          <BaseLink
            link="/podcast"
            className="group inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-70"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground transition-all group-hover:-translate-x-0.5">
              <ArrowLeft className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="text-14 font-bold">All episodes</span>
          </BaseLink>
        </div>
      </article>

      {otherEpisodes.length > 0 && (
        <section className="section py-12 md:py-24">
          <div className="flex flex-col gap-8">
            <h2 className="text-30 leading-tight font-medium tracking-tight text-balance md:text-36">
              More episodes
            </h2>
            <div className="flex flex-col border-t border-border">
              {otherEpisodes.map((other) => (
                <EpisodeRow key={other._id} episode={other} />
              ))}
            </div>
          </div>
        </section>
      )}

      {globals.after.length > 0 && (
        <Sections sections={globals.after} withDataFirstAttribute={false} />
      )}
    </>
  );
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const [episode, site] = await Promise.all([
    getEpisode(slug),
    getSite().catch(() => null),
  ]);

  if (!episode) return { title: "Not Found" };

  const ogTitle = episode.title || "Episode";
  const description = buildSeoDescription({
    metadataDescription: episode.metadata?.description,
    excerpt: episode.summary,
    site,
  });
  const ogImage = episode.metadata?.image?.image?.asset
    ? episode.metadata.image
    : (episode.coverArt ?? episode.show?.coverArt);
  const url = resolveUrl({
    _type: "podcast-episode",
    metadata: { slug: { _type: "slug", current: episode.slug ?? "" } },
  });

  return {
    title: buildSeoTitle({
      metadata: episode.metadata,
      documentTitle: episode.title,
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
    ...buildRobotsAndAlternates(episode.metadata, url, { isIndexable: IS_INDEXABLE }),
  };
};

export const generateStaticParams = async () => {
  const slugs = await client.fetch(
    PodcastEpisodeSlugsQuery,
    {},
    { perspective: "published" },
  );

  return slugs
    .map(({ slug }) => slug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }));
};

export default EpisodePage;
