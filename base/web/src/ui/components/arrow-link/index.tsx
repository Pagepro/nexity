import { GoArrowRight } from "react-icons/go";

import { cn } from "@/lib/utils";
import { LinkFragment } from "@/types/fragments";
import { BaseLink } from "@/ui/components/Link/BaseLink";

type ArrowLinkProps = {
  link: LinkFragment;
  children: React.ReactNode;
  className?: string;
};

const ArrowLink = ({ link, children, className }: ArrowLinkProps) => (
  <BaseLink
    link={link}
    className={cn(
      "group inline-flex items-center gap-2 transition-opacity hover:opacity-70",
      className,
    )}
  >
    <span className="text-sm font-bold">{children}</span>
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground transition-transform group-hover:translate-x-0.5">
      <GoArrowRight className="h-3.5 w-3.5 text-background" />
    </span>
  </BaseLink>
);

export default ArrowLink;
