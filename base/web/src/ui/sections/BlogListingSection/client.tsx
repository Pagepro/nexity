"use client";

import ListingGrid from "@/ui/listing/listing-grid";

import { CATEGORIES } from "./constants";
import PostCard from "./post-card";
import { BlogPost } from "./types";

interface BlogListingClientProps {
  posts: BlogPost[];
  total: number;
  perPage: number;
}

const parseResponse = (data: unknown) => {
  const payload = data as { posts?: BlogPost[]; total?: number };

  return { items: payload.posts ?? [], total: payload.total ?? 0 };
};

const BlogListingClient = ({ posts, total, perPage }: BlogListingClientProps) => (
  <ListingGrid<BlogPost>
    initialItems={posts}
    initialTotal={total}
    perPage={perPage}
    categories={CATEGORIES}
    apiPath="/api/blog/posts"
    parseResponse={parseResponse}
    renderCard={(post) => <PostCard key={post._id} post={post} />}
    searchPlaceholder="What would you like to read about?"
    searchLabel="Search articles"
    emptyLabel="No posts found"
  />
);

export default BlogListingClient;
