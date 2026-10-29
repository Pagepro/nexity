import { PostDetailQueryResult } from "@/types/sanity.types";
import PostCard from "@/ui/sections/BlogListingSection/post-card";

type OtherArticle = NonNullable<NonNullable<PostDetailQueryResult>["otherPosts"]>[number];

interface OtherArticlesProps {
  items: OtherArticle[];
}

export const OtherArticles = ({ items }: OtherArticlesProps) => {
  if (!items.length) return null;

  return (
    <section className="section py-12 md:py-24">
      <div className="flex flex-col items-center gap-12">
        <h2 className="max-w-xl text-center text-30 leading-tight font-medium tracking-tight text-balance md:text-36">
          Other articles
        </h2>

        <div className="grid w-full gap-8 md:grid-cols-3">
          {items.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
};
