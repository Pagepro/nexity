import clsx from "clsx";

import { CommonButtonProps } from "./types";

export const getVariantClasses = (
  variant: CommonButtonProps["variant"],
  loading: CommonButtonProps["loading"],
  disabled: CommonButtonProps["disabled"],
) => {
  switch (variant) {
    case "primary":
      return clsx({
        "border-muted bg-muted text-muted-foreground": !loading && disabled,
        "border-primary bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary":
          loading || !disabled,
      });
    case "secondary":
      return clsx({
        "border-muted bg-muted text-muted-foreground": !loading && disabled,
        "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-ring":
          loading || !disabled,
      });
    case "primary-outline":
      return clsx({
        "border-muted bg-transparent text-muted-foreground": !loading && disabled,
        "border-foreground/20 bg-transparent text-foreground hover:bg-foreground hover:text-background focus-visible:ring-foreground":
          loading || !disabled,
      });
    case "ghost":
      // Opaque `--button-ghost-hover`, not a `foreground/5` wash: the header uses
      // this variant, and a translucent wash can't read over an unknown backdrop.
      return clsx({
        "border-transparent bg-transparent text-muted-foreground": !loading && disabled,
        "border-transparent bg-transparent text-foreground hover:bg-button-ghost-hover focus-visible:ring-foreground":
          loading || !disabled,
      });
    case "secondary-outline":
      return clsx({
        "border-muted bg-transparent text-muted-foreground": !loading && disabled,
        "border-border bg-transparent text-foreground hover:bg-muted focus-visible:ring-ring":
          loading || !disabled,
      });
    case "link":
      return clsx("underline-none", {
        "text-muted-foreground": !loading && disabled,
        "text-foreground hover:text-foreground/70 focus-visible:ring-foreground":
          loading || !disabled,
      });
    case "light":
      return clsx({
        "border-muted bg-muted text-muted-foreground": !loading && disabled,
        "border-background bg-background text-foreground hover:border-background hover:bg-transparent hover:text-background focus-visible:ring-foreground":
          loading || !disabled,
      });
    case "light-outline":
      return clsx({
        "border-muted-foreground/50 bg-transparent text-muted-foreground/50":
          !loading && disabled,
        "border-background bg-transparent text-background hover:bg-background hover:text-foreground focus-visible:ring-background":
          loading || !disabled,
      });
    default:
      return "";
  }
};

export const getSizeClasses = (
  size: CommonButtonProps["size"],
  variant: CommonButtonProps["variant"],
  loading: CommonButtonProps["loading"],
) => {
  if (variant === "plain") {
    return "";
  }

  switch (size) {
    case "sm": {
      if (variant === "link") {
        return "text-14";
      }

      return clsx("h-8", loading ? "px-2" : "px-3");
    }
    case "md": {
      if (variant === "link") {
        return "text-16";
      }

      return clsx("h-9", loading ? "px-3" : "px-4");
    }
    case "lg": {
      if (variant === "link") {
        return "text-18";
      }

      return clsx("h-11", loading ? "px-4" : "px-6");
    }
    default:
      return "";
  }
};

export const getLoaderColors = (variant: CommonButtonProps["variant"]) => {
  switch (variant) {
    case "primary":
      return {
        color: "light",
        beforeBgClassName: "before:bg-foreground",
      };
    case "secondary":
      return {
        color: "light",
        beforeBgClassName: "before:bg-primary",
      };
    case "primary-outline":
    case "ghost":
    case "link":
    case "light":
      return {
        color: "primary",
        beforeBgClassName: "before:bg-background",
      };
    case "secondary-outline":
      return {
        color: "secondary",
        beforeBgClassName: "before:bg-background",
      };
    default:
      return {
        color: "light",
        beforeBgClassName: "before:bg-background",
      };
  }
};
