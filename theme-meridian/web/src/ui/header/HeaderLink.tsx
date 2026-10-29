import clsx from "clsx";
import React, { FC, PropsWithChildren } from "react";

import { BaseLink } from "@/ui/components/Link/BaseLink";

import { HeaderLinkProps } from "./types";

const HeaderLink: FC<PropsWithChildren<HeaderLinkProps>> = ({
  className,
  type,
  label,
  internal,
  internalPath,
  external,
  file,
  params,
  children,
  current,
}) => (
  <BaseLink
    className={clsx(
      "text-sm transition-colors",
      className || "text-foreground/80 hover:text-foreground",
      {
        "font-bold text-foreground": current,
      },
    )}
    link={{ type, internal, internalPath, params, external, file }}
    aria-current={current}
  >
    {children || label || internal?.title || internalPath || external}
  </BaseLink>
);

export default HeaderLink;
