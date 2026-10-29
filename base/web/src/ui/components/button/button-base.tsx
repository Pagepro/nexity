import clsx from "clsx";
import { stegaClean } from "next-sanity";
import React from "react";

import Spinner from "../Spinner";

import { ButtonBaseProps } from "./types";
import { getLoaderColors, getSizeClasses, getVariantClasses } from "./utils";

const ButtonBase: React.FC<ButtonBaseProps> = ({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  children,
  ...props
}) => {
  const variantValue = stegaClean(variant);
  const variantClasses = getVariantClasses(variantValue, loading, disabled);
  const sizeClasses = getSizeClasses(stegaClean(size), variantValue, loading);
  const loaderColors = getLoaderColors(variantValue);

  const baseClasses = clsx(
    "inline-flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none enabled:cursor-pointer disabled:pointer-events-none",
    variantClasses,
    sizeClasses,
    className,
    {
      "rounded-md border text-14 whitespace-nowrap [&_.icon-container]:text-16":
        variantValue !== "link" && variantValue !== "plain",
      "font-medium": variantValue !== "plain" && variantValue !== "link",
      "pointer-events-none": disabled,
    },
  );

  const content = (
    <>
      {loading && (
        <Spinner
          className="h-4 w-4"
          color={loaderColors.color as "primary" | "secondary" | "light"}
          beforeBgClassName={loaderColors.beforeBgClassName}
        />
      )}
      {!loading && icon && iconPosition === "left" && (
        <span className="icon-container inline-flex shrink-0 items-center">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === "right" && (
        <span className="icon-container inline-flex shrink-0 items-center">{icon}</span>
      )}
    </>
  );

  return (
    <span className={baseClasses} {...props}>
      {content}
    </span>
  );
};

ButtonBase.displayName = "ButtonBase";

export default ButtonBase;
