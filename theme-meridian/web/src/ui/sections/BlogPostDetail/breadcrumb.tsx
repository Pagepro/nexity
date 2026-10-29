import { ChevronRight } from "lucide-react";

import { BaseLink } from "@/ui/components/Link/BaseLink";

interface BreadcrumbProps {
  title: string;
}

export const Breadcrumb = ({ title }: BreadcrumbProps) => (
  <nav
    aria-label="Breadcrumb"
    className="flex flex-wrap items-center justify-center gap-1.5 text-14 text-muted-foreground"
  >
    <BaseLink link="/" className="transition-colors hover:text-foreground">
      Home
    </BaseLink>
    <ChevronRight className="size-3.5 shrink-0" aria-hidden />
    <BaseLink link="/blog" className="transition-colors hover:text-foreground">
      Blog
    </BaseLink>
    <ChevronRight className="size-3.5 shrink-0" aria-hidden />
    <span className="truncate text-foreground" aria-current="page">
      {title}
    </span>
  </nav>
);
