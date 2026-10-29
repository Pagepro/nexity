import { toInitials } from "@/lib/initials";
import { cn } from "@/lib/utils";
import { ImageFragment } from "@/types/fragments";
import Image from "@/ui/components/image";

import { formatPersonSubtitle } from "./utils";

interface PersonBylineProps {
  person: {
    firstName: string | null;
    lastName: string | null;
    position: string | null;
    company: string | null;
    avatar: ImageFragment | null;
  } | null;
  prefix?: string;
  className?: string;
}

export const PersonByline = ({ person, prefix, className }: PersonBylineProps) => {
  if (!person) return null;

  const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
  const subtitle = formatPersonSubtitle(person.position, person.company);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-foreground/10 bg-muted font-medium text-foreground">
        {person.avatar?.image?.asset ? (
          <Image sanityImage={person.avatar} sizes="40px" className="object-cover" fill />
        ) : (
          <span aria-hidden>{toInitials(name)}</span>
        )}
      </span>
      <span className="flex min-w-0 flex-col text-14">
        <span className="font-medium text-foreground">
          {prefix ? `${prefix} ${name}` : name}
        </span>
        {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
      </span>
    </div>
  );
};
