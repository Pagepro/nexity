import Link from "next/link";

import { formatListingMeta } from "@/ui/listing/listing-utils";

import Image from "../../components/image";

import { BlogPost } from "./types";

const FeaturedPost = ({ post }: { post: BlogPost }) => {
  const meta = formatListingMeta(post.category, post.publishedAt);
  const href = post.slug ? `/blog/${post.slug}` : "#";

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-16">
        <div className="flex flex-col justify-between gap-8 p-6 lg:basis-5/12 lg:p-10">
          <div className="flex flex-col gap-5">
            {meta && (
              <p className="text-10 font-medium tracking-wider text-muted-foreground uppercase">
                {meta}
              </p>
            )}
            <h2 className="text-30 leading-tight font-medium text-balance text-foreground md:text-36">
              <Link href={href} className="transition-colors hover:text-foreground/70">
                {post.title}
              </Link>
            </h2>
            {post.author && (
              <p className="text-14 text-muted-foreground">
                By {post.author.firstName} {post.author.lastName}
              </p>
            )}
            {post.excerpt && (
              <p className="text-16 leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
            )}
          </div>

          <Link
            href={href}
            className="inline-flex h-9 w-fit items-center justify-center rounded-md border border-input px-4 text-14 font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            Read article
          </Link>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-muted lg:aspect-auto lg:basis-7/12">
          {post.coverImage?.image?.asset && (
            <Image
              sanityImage={post.coverImage}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturedPost;
