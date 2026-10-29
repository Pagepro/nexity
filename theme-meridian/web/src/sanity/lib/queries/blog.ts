import { defineQuery } from "groq";

import { AUTHOR_FRAGMENT } from "@/sanity/lib/fragments/author";
import { IMAGE_FRAGMENT } from "@/sanity/lib/fragments/image";
import { METADATA_FRAGMENT } from "@/sanity/lib/fragments/metadata";
import { STRUCTURED_DATA_FRAGMENT } from "@/sanity/lib/fragments/structured-data";
import { RICHTEXT_QUERY, SECTIONS_QUERY } from "@/sanity/lib/queries";

const POST_CARD_PROJECTION = `
  _id,
  "title": metadata.title,
  "slug": metadata.slug.current,
  category,
  "author": authors[0]->{ ${AUTHOR_FRAGMENT} },
  excerpt,
  publishedAt,
  coverImage {
    ${IMAGE_FRAGMENT}
  }
`;

export const BlogListingPageQuery = defineQuery(`
  *[_type == 'blog-listing-page' && _id == 'blogListingPage'][0]{
    ...,
    content[] {
      ${RICHTEXT_QUERY}
    },
    featuredPost[0]->{ ${POST_CARD_PROJECTION} },
    'sections': sections[]{ ${SECTIONS_QUERY} },
    metadata {
      ${METADATA_FRAGMENT}
    },
    ${STRUCTURED_DATA_FRAGMENT},
  }
`);

const BLOG_POSTS_FILTER = `_type == 'post'
  && ($category == '' || category == $category)
  && ($q == '' || metadata.title match $q || excerpt match $q)
  && !(_id in $excludeIds)`;

// Typegen-only (constant slice); the runtime query is `buildBlogPostsPageQuery`.
export const BlogPostsPageQuery = defineQuery(`{
  "posts": *[${BLOG_POSTS_FILTER}] | order(publishedAt desc) [0...6] { ${POST_CARD_PROJECTION} },
  "total": count(*[${BLOG_POSTS_FILTER}])
}`);

export const BlogFeaturedIdsQuery = defineQuery(
  `*[_type == 'blog-listing-page' && _id == 'blogListingPage'][0].featuredPost[]._ref`,
);

// GROQ forbids params in slices, so `start`/`end` are interpolated: pass only
// validated, clamped integers.
export const buildBlogPostsPageQuery = (start: number, end: number): string => `{
  "posts": *[${BLOG_POSTS_FILTER}] | order(publishedAt desc) [${start}...${end}] { ${POST_CARD_PROJECTION} },
  "total": count(*[${BLOG_POSTS_FILTER}])
}`;

export const PostDetailQuery = defineQuery(`
  *[_type == 'post' && metadata.slug.current == $documentSlug][0]{
    "title": metadata.title,
    "slug": metadata.slug.current,
    category,
    "author": authors[0]->{ ${AUTHOR_FRAGMENT} },
    excerpt,
    publishedAt,
    coverImage {
      ${IMAGE_FRAGMENT}
    },
    body[] {
      ${RICHTEXT_QUERY}
    },
    metadata {
      ${METADATA_FRAGMENT}
    },
    ${STRUCTURED_DATA_FRAGMENT},
    // "Other articles": same-category posts first (newest-first), topped up to 3
    // with the most recent posts from any category. \`select(... => 0, 1)\` ranks
    // same-category as 0 so ascending order floats them to the top; \`^.category\`
    // is the post being viewed. Slice bounds must be constant literals.
    'otherPosts': *[_type == 'post' && metadata.slug.current != $documentSlug]
      | order(select(category == ^.category => 0, 1) asc, publishedAt desc)[0...3]{
        ${POST_CARD_PROJECTION}
      },
  }
`);

export const PostSlugsQuery = defineQuery(`
  *[_type == 'post' && defined(metadata.slug.current)]{
    "slug": metadata.slug.current
  }
`);
