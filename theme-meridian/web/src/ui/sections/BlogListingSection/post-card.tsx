import Link from "next/link";

import { formatListingMeta } from "@/ui/listing/listing-utils";

import Image from "../../components/image";

import { BlogPost } from "./types";

const PostCard = ({ post }: { post: BlogPost }) => {
  const meta = formatListingMeta(post.category, post.publishedAt);
  const href = post.slug ? `/blog/${post.slug}` : "#";

  return (
    <Link
      href={href}
      className="card-frame group flex h-full flex-col gap-6 overflow-hidden rounded-lg border-4 border-background bg-card p-6 shadow-card transition-shadow hover:shadow-xl"
    >
      <div className="flex flex-col gap-3">
        {meta && (
          <p className="text-10 font-medium tracking-wider text-muted-foreground uppercase">
            {meta}
          </p>
        )}
        <h3 className="text-18 leading-snug font-medium text-balance text-foreground transition-colors group-hover:text-foreground/70">
          {post.title}
        </h3>
        {post.author && (
          <p className="text-14 leading-relaxed text-muted-foreground">
            By {post.author.firstName} {post.author.lastName}
          </p>
        )}
      </div>

      {post.coverImage?.image?.asset && (
        <div className="relative mt-auto aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
          <Image
            sanityImage={post.coverImage}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
    </Link>
  );
};

export default PostCard;
