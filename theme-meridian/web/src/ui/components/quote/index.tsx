import { toInitials } from "@/lib/initials";
import { cn } from "@/lib/utils";
import { ImageFragment } from "@/types/fragments";
import Image from "@/ui/components/image";

export interface QuoteProps {
  text: string;
  author?: string | null;
  role?: string | null;
  company?: string | null;
  avatar?: ImageFragment | null;
  mark?: ImageFragment | null;
  className?: string;
}

export const Quote = ({
  text,
  author,
  role,
  company,
  avatar,
  mark,
  className,
}: QuoteProps) => {
  const subtitle = [role, company].filter(Boolean).join(", ");
  const initials = toInitials(author);

  if (!text) {
    return null;
  }

  return (
    <figure
      className={cn("flex max-w-2xl flex-col items-center gap-8 text-center", className)}
    >
      {mark?.image && (
        <Image sanityImage={mark} sizes="48px" className="h-8 w-auto object-contain" />
      )}

      <blockquote className="text-20 leading-9 font-medium text-balance text-foreground">
        {text}
      </blockquote>

      {(author || subtitle || avatar?.image) && (
        <figcaption className="flex flex-col items-center gap-4">
          {(avatar?.image || initials) && (
            <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-foreground/10 bg-muted text-16 font-medium text-foreground">
              {avatar?.image ? (
                <Image sanityImage={avatar} sizes="56px" className="object-cover" fill />
              ) : (
                <span aria-hidden>{initials}</span>
              )}
            </span>
          )}
          <span className="flex flex-col">
            {author && (
              <span className="text-16 font-medium text-foreground">{author}</span>
            )}
            {subtitle && (
              <span className="text-16 text-muted-foreground">{subtitle}</span>
            )}
          </span>
        </figcaption>
      )}
    </figure>
  );
};
