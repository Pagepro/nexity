import clsx from "clsx";
import { FC } from "react";

import { BaseLink } from "@/ui/components/Link/BaseLink";

import { SearchActionProps } from "./types";

const SearchAction: FC<SearchActionProps> = ({ searchLink, className }) => {
  if (!searchLink?.type) return null;

  return (
    <BaseLink
      link={searchLink}
      className={clsx(
        "inline-flex h-8 items-center justify-center rounded-md px-2.5 text-14 font-medium text-foreground transition-colors hover:bg-button-ghost-hover",
        className,
      )}
    >
      {searchLink.label || "Search"}
    </BaseLink>
  );
};

export default SearchAction;
