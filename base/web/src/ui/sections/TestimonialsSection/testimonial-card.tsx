import { toInitials } from "@/lib/initials";
import Image from "@/ui/components/image";
import RichText from "@/ui/RichText";

import { Testimonial } from "./types";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export const TestimonialCard = ({ testimonial }: TestimonialCardProps) => {
  const { quote, author, role, company, avatar } = testimonial;
  const subtitle = [role, company].filter(Boolean).join(", ");

  return (
    <figure className="relative flex h-full flex-col justify-between gap-12 overflow-hidden rounded-lg border border-border bg-card-muted p-6 shadow-sm">
      {quote && (
        <blockquote className="text-foreground">
          <RichText value={quote} />
        </blockquote>
      )}

      <figcaption className="flex items-start gap-3">
        {avatar?.image ? (
          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-foreground/10">
            <Image sanityImage={avatar} sizes="40px" className="object-cover" fill />
          </div>
        ) : (
          author && (
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-12 font-medium text-foreground"
            >
              {toInitials(author)}
            </span>
          )
        )}
        <div className="flex min-w-0 flex-col">
          {author && (
            <span className="truncate text-14 font-medium text-foreground">{author}</span>
          )}
          {subtitle && (
            <span className="truncate text-14 text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </figcaption>
    </figure>
  );
};
