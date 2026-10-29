import { flattenSharedSections } from "@/lib/schema-org/build-graph";
import type {
  CaseStudyDetailQueryResult,
  PodcastEpisodeDetailQueryResult,
  PostDetailQueryResult,
} from "@/types/sanity.types";
import { postListItem } from "@/ui/sections/BlogListingSection/markdown";
import type { BlogPost } from "@/ui/sections/BlogListingSection/types";
import { caseStudyListItem } from "@/ui/sections/CaseStudiesListingSection/markdown";
import type { CaseStudy } from "@/ui/sections/CaseStudiesListingSection/types";
import { PLATFORM_LABELS } from "@/ui/sections/PodcastListingSection/constants";
import {
  episodeListItem,
  personLine,
} from "@/ui/sections/PodcastListingSection/markdown";
import type { Episode, PlatformLink } from "@/ui/sections/PodcastListingSection/types";
import {
  formatDuration,
  formatEpisodeMeta,
} from "@/ui/sections/PodcastListingSection/utils";

import {
  blockquote,
  bulletList,
  heading,
  imageHint,
  inlineLink,
  joinBlocks,
  labelLine,
  paragraph,
} from "./blocks";
import { cleanText, escapeMarkdown, markdownText, yamlString } from "./escape";
import {
  leadingHeading,
  portableTextToMarkdown,
  portableTextToPlainText,
} from "./portable-text";
import { sectionsToMarkdown } from "./section-serializers";
import type { MarkdownContext } from "./types";

export interface MarkdownFrontmatter {
  title: string;
  description?: string | null;
  url: string;
  published?: string | null;
  updated?: string | null;
}

type SectionList = Parameters<typeof sectionsToMarkdown>[0];

const UNTITLED = "Untitled page";

const isoDate = (value: string | null | undefined): string | null =>
  value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;

export const frontmatter = ({
  title,
  description,
  url,
  published,
  updated,
}: MarkdownFrontmatter) =>
  [
    "---",
    `title: ${yamlString(cleanText(title))}`,
    cleanText(description) ? `description: ${yamlString(cleanText(description))}` : "",
    `url: ${url}`,
    isoDate(published) ? `published: ${isoDate(published)}` : "",
    isoDate(updated) ? `updated: ${isoDate(updated)}` : "",
    "---",
  ]
    .filter(Boolean)
    .join("\n");

const markdownDocument = (meta: MarkdownFrontmatter, title: string, body: string[]) => {
  const documentTitle = cleanText(title) || cleanText(meta.title) || UNTITLED;

  return `${joinBlocks([
    frontmatter({ ...meta, title: cleanText(meta.title) || documentTitle }),
    `# ${escapeMarkdown(documentTitle)}`,
    ...body,
  ])}\n`;
};

const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const formatLongDate = (value: string | null | undefined) =>
  value ? LONG_DATE.format(new Date(value)) : "";

const byline = (
  author: { firstName?: string | null; lastName?: string | null } | null | undefined,
) => {
  const name = [author?.firstName, author?.lastName]
    .map(cleanText)
    .filter(Boolean)
    .join(" ");

  return name ? `By ${name}` : "";
};

const metaLine = (parts: (string | null | undefined)[]) =>
  labelLine(parts.map(cleanText).filter(Boolean).join(" · "));

const promoteHeading = (
  content: unknown,
  fallback: string,
  context: MarkdownContext,
  { anyLevel = false }: { anyLevel?: boolean } = {},
) => {
  const leading = leadingHeading(content, { anyLevel });

  return leading
    ? { title: leading.text, context: { ...context, skipBlockKey: leading.key } }
    : { title: fallback, context };
};

export interface PageMarkdownInput {
  meta: MarkdownFrontmatter;
  title?: string | null;
  /** Global before + the page's sections + global after, as the route renders them. */
  sections: SectionList;
  context: MarkdownContext;
}

export const pageToMarkdown = ({
  meta,
  title: pageTitle,
  sections,
  context,
}: PageMarkdownInput): string => {
  const title = cleanText(pageTitle) || cleanText(meta.title);
  const flat = flattenSharedSections(
    sections as Parameters<typeof flattenSharedSections>[0],
  );
  const visible = flat.filter(
    (section) =>
      !(section as { options?: { hidden?: boolean | null } | null }).options?.hidden,
  );
  const [first, ...rest] = visible;
  const promoted = promoteHeading(
    (first as { content?: unknown } | undefined)?.content,
    title,
    context,
    {
      anyLevel:
        !title || cleanText((first as { _type?: string } | undefined)?._type) === "hero",
    },
  );

  return markdownDocument(
    { ...meta, title: meta.title || promoted.title },
    promoted.title,
    [
      first ? sectionsToMarkdown([first] as SectionList, promoted.context) : "",
      sectionsToMarkdown(rest as SectionList, context),
    ],
  );
};

interface GlobalSections {
  before: SectionList;
  after: SectionList;
}

export interface DetailMarkdownInput<TDocument> {
  meta: MarkdownFrontmatter;
  document: NonNullable<TDocument>;
  globals: GlobalSections;
  context: MarkdownContext;
}

export const postToMarkdown = ({
  meta,
  document: post,
  globals,
  context,
}: DetailMarkdownInput<PostDetailQueryResult>): string =>
  markdownDocument(meta, cleanText(post.title) || meta.title, [
    metaLine(["Blog", formatLongDate(post.publishedAt), byline(post.author)]),
    paragraph(post.excerpt),
    imageHint(post.coverImage),
    sectionsToMarkdown(globals.before, context),
    portableTextToMarkdown(post.body, context),
    sectionsToMarkdown(globals.after, context),
  ]);

const caseStudyQuote = (quote: NonNullable<CaseStudyDetailQueryResult>["quote"]) => {
  const text = markdownText(portableTextToPlainText(quote?.quote)).replace(/\n/g, "  \n");
  if (!text) return "";

  const attribution = [quote?.author, quote?.role, quote?.company]
    .map((value) => markdownText(value))
    .filter(Boolean)
    .join(", ");

  return blockquote(joinBlocks([text, attribution && `— ${attribution}`]));
};

export const caseStudyToMarkdown = ({
  meta,
  document: caseStudy,
  globals,
  context,
}: DetailMarkdownInput<CaseStudyDetailQueryResult>): string =>
  markdownDocument(meta, cleanText(caseStudy.title) || meta.title, [
    metaLine([
      cleanText(caseStudy.eyebrow) || "Case study",
      formatLongDate(caseStudy.publishedAt),
      byline(caseStudy.author),
    ]),
    paragraph(caseStudy.excerpt),
    bulletList(
      (caseStudy.metrics ?? []).map((metric) => {
        const value = markdownText(metric?.value);
        const label = markdownText(metric?.label);

        return [value && `**${value}**`, label].filter(Boolean).join(" ");
      }),
    ),
    sectionsToMarkdown(globals.before, context),
    portableTextToMarkdown(caseStudy.body, context),
    caseStudyQuote(caseStudy.quote),
    sectionsToMarkdown(globals.after, context),
  ]);

const platformLine = (links: PlatformLink[] | null | undefined) => {
  const items = (links ?? [])
    .map((link) => {
      const url = cleanText(link?.url);
      const platform = cleanText(link?.platform);
      if (!url) return "";

      return inlineLink(
        markdownText(PLATFORM_LABELS[platform] ?? platform) || "Listen",
        url,
      );
    })
    .filter(Boolean);

  return items.length ? `Listen on: ${items.join(", ")}` : "";
};

const chapterList = (
  chapters: { timestamp?: string | null; title?: string | null }[] | null | undefined,
) =>
  bulletList(
    (chapters ?? []).map((chapter) =>
      [markdownText(chapter?.timestamp), markdownText(chapter?.title)]
        .filter(Boolean)
        .join(" "),
    ),
  );

export const episodeToMarkdown = ({
  meta,
  document: episode,
  globals,
  context,
}: DetailMarkdownInput<PodcastEpisodeDetailQueryResult>): string => {
  const guest = personLine(episode.guest);
  const host = personLine(episode.show?.host);
  const chapters = chapterList(episode.chapters);
  const links = episode.platformLinks?.length
    ? episode.platformLinks
    : episode.show?.platformLinks;
  const transcript = portableTextToMarkdown(episode.transcript, context);

  return markdownDocument(meta, cleanText(episode.title) || meta.title, [
    metaLine([
      episode.show?.title,
      formatEpisodeMeta(episode.episodeNumber, episode.publishedAt),
      formatDuration(episode.durationMinutes),
    ]),
    paragraph(episode.summary),
    bulletList([
      guest && `Guest: ${markdownText(guest)}`,
      host && `Hosted by: ${markdownText(host)}`,
    ]),
    platformLine(links),
    sectionsToMarkdown(globals.before, context),
    chapters && joinBlocks([heading(2, "Chapters"), chapters]),
    portableTextToMarkdown(episode.showNotes, context),
    transcript && joinBlocks([heading(2, "Transcript"), transcript]),
    sectionsToMarkdown(globals.after, context),
  ]);
};

export interface ListingMarkdownInput<TItem, TFeatured = TItem> {
  meta: MarkdownFrontmatter;
  page: { title?: string | null; content?: unknown };
  featured: TFeatured | null | undefined;
  /** The page's sections, with the listing section's items already injected. */
  sections: SectionList;
  context: MarkdownContext;
}

const listingDocument = <TItem>(
  { meta, page, featured, sections, context }: ListingMarkdownInput<TItem>,
  featuredItem: (item: TItem, context: MarkdownContext) => string,
): string => {
  const promoted = promoteHeading(
    page.content,
    cleanText(page.title) || meta.title,
    context,
    {
      anyLevel: true,
    },
  );

  return markdownDocument(meta, promoted.title, [
    portableTextToMarkdown(page.content, promoted.context),
    featured
      ? joinBlocks([
          heading(2, "Featured"),
          bulletList([featuredItem(featured, context)]),
        ])
      : "",
    sectionsToMarkdown(sections, context),
  ]);
};

export const blogListingPageToMarkdown = (input: ListingMarkdownInput<BlogPost>) =>
  listingDocument(input, postListItem);

export const caseStudiesListingPageToMarkdown = (
  input: ListingMarkdownInput<CaseStudy>,
) => listingDocument(input, caseStudyListItem);

export interface PodcastListingMarkdownInput extends ListingMarkdownInput<Episode> {
  page: ListingMarkdownInput<Episode>["page"] & {
    pretitle?: string | null;
    host?: Parameters<typeof personLine>[0];
    platformLinks?: PlatformLink[] | null;
  };
}

const latestEpisodeItem = (episode: Episode, context: MarkdownContext) => {
  const chapters = episode.coverArt?.image?.asset ? "" : chapterList(episode.chapters);

  return [
    episodeListItem(episode, context),
    platformLine(episode.platformLinks),
    chapters && `Chapters:\n${chapters}`,
  ]
    .filter(Boolean)
    .join("\n");
};

export const podcastListingPageToMarkdown = ({
  meta,
  page,
  featured,
  sections,
  context,
}: PodcastListingMarkdownInput): string => {
  const host = personLine(page.host);

  return markdownDocument(meta, cleanText(page.title) || meta.title, [
    labelLine(page.pretitle),
    portableTextToMarkdown(page.content, context),
    host && `Hosted by ${markdownText(host)}`,
    platformLine(page.platformLinks),
    featured
      ? joinBlocks([
          heading(2, "Latest episode"),
          bulletList([latestEpisodeItem(featured, context)]),
        ])
      : "",
    sectionsToMarkdown(sections, context),
  ]);
};
