import { BlogPostsPageQueryResult } from "@/types/sanity.types";
import { ExtractSectionProps } from "@/types/sections";

export type BlogPost = BlogPostsPageQueryResult["posts"][number];

/** `posts`/`total` are injected by `blog/page.tsx`, not stored; optional so the component stays assignable to `SectionMap`. */
export interface BlogListingSectionProps extends ExtractSectionProps<"blog-listing"> {
  posts?: BlogPost[];
  total?: number;
}
