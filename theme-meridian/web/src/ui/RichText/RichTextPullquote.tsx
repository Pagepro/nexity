import Image from "@/ui/components/image";

import { PullquoteValue } from "./types";

const RichTextPullquote: React.FC<{ value: PullquoteValue }> = ({ value }) => {
  const { quote, author, role, avatar } = value;

  if (!quote) return null;

  return (
    <figure className="richtext-embed flex flex-col items-start justify-center gap-8 border-l-2 border-border py-4 pl-8">
      <blockquote className="text-16 leading-8 text-muted-foreground italic">
        {quote}
      </blockquote>

      {(author || avatar?.image) && (
        <figcaption className="flex items-center gap-3">
          {avatar?.image && (
            <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-foreground/10">
              <Image sanityImage={avatar} sizes="40px" className="object-cover" fill />
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            {author && (
              <span className="text-14 font-medium text-foreground not-italic">
                {author}
              </span>
            )}
            {role && (
              <span className="text-14 text-muted-foreground not-italic">{role}</span>
            )}
          </div>
        </figcaption>
      )}
    </figure>
  );
};

export default RichTextPullquote;
