import { Suspense } from "react";

import sectionProps from "@/lib/sectionProps";

import BlogListingClient from "./client-lazy";
import { LISTING_HEADING, POSTS_PER_PAGE } from "./constants";
import PostCard from "./post-card";
import { BlogListingSectionProps } from "./types";

const ListingHeading = () => (
  <h2 className="text-30 leading-tight font-medium tracking-tight text-foreground md:text-36">
    {LISTING_HEADING}
  </h2>
);

const BlogListingFallback = ({ posts }: { posts: BlogListingSectionProps["posts"] }) => {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
};

const BlogListingSection = ({
  posts = [],
  total = 0,
  perPage,
  // Pulled out so `...props` (spread onto the DOM <section>) doesn't leak it as an invalid attribute.
  postsPerPage: _postsPerPage,
  ...props
}: BlogListingSectionProps) => (
  <section className="section pt-8 pb-8 md:pt-16 md:pb-12" {...sectionProps(props)}>
    <ListingHeading />
    <Suspense fallback={<BlogListingFallback posts={posts} />}>
      <BlogListingClient
        posts={posts}
        total={total}
        perPage={perPage ?? POSTS_PER_PAGE}
      />
    </Suspense>
  </section>
);

export default BlogListingSection;
