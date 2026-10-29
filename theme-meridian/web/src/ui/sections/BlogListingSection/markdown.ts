import { bulletList, heading, inlineLink, joinBlocks } from "@/lib/markdown/blocks";
import { cleanText, markdownText } from "@/lib/markdown/escape";
import type { SectionMarkdownSerializer } from "@/lib/markdown/sections";
import type { MarkdownContext } from "@/lib/markdown/types";
import { formatListingMeta } from "@/ui/listing/listing-utils";

import { LISTING_HEADING } from "./constants";
import type { BlogListingSectionProps, BlogPost } from "./types";

const byline = (author: BlogPost["author"]) => {
  const name = [author?.firstName, author?.lastName]
    .map(cleanText)
    .filter(Boolean)
    .join(" ");

  return name ? `By ${name}` : "";
};

export const postListItem = (post: BlogPost, context: MarkdownContext): string => {
  const slug = cleanText(post.slug);
  const url = slug
    ? context.documentUrl({ _type: "post", metadata: { slug: { current: slug } } })
    : null;
  const meta = [
    formatListingMeta(cleanText(post.category), post.publishedAt),
    byline(post.author),
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    inlineLink(markdownText(post.title), url),
    markdownText(meta),
    markdownText(post.excerpt),
  ]
    .filter(Boolean)
    .join("\n");
};

export const blogListingToMarkdown: SectionMarkdownSerializer<BlogListingSectionProps> = (
  section,
  context,
) => {
  const posts = section.posts ?? [];
  const listingUrl = context.absoluteUrl("/blog");

  return joinBlocks([
    heading(2, LISTING_HEADING),
    posts.length
      ? bulletList(posts.map((post) => postListItem(post, context)))
      : inlineLink("All articles", listingUrl),
  ]);
};
