import clsx from "clsx";
import { stegaClean } from "next-sanity";
import React, { FC, PropsWithChildren } from "react";

import ArrowLink from "../arrow-link";
import Icon from "../Icon";
import { BaseLink } from "../Link/BaseLink";

import ButtonBase from "./button-base";
import { ButtonLinkProps } from "./types";

export const ButtonLink: FC<PropsWithChildren<ButtonLinkProps>> = ({
  link,
  children,
  className,
  disabled,
  loading,
  size,
  variant,
  icon: iconProp,
  iconPosition: iconPositionProp,
  buttonIcon,
  buttonClassName,
}) => {
  const icon = buttonIcon?.withIcon ? buttonIcon.icon : undefined;
  const iconPosition = buttonIcon?.withIcon ? buttonIcon?.iconPlacement : undefined;

  if (!link) {
    return null;
  }

  if (stegaClean(variant) === "arrow-link") {
    return (
      <ArrowLink link={link} className={className}>
        {children}
      </ArrowLink>
    );
  }

  return (
    <BaseLink
      {...{ link }}
      className={clsx(className, {
        "pointer-events-none": disabled,
      })}
    >
      <ButtonBase
        disabled={disabled}
        icon={
          iconProp ||
          (icon ? <Icon icon={stegaClean(icon)} className="fill-current" /> : undefined)
        }
        iconPosition={stegaClean(iconPositionProp || iconPosition)}
        loading={loading}
        size={size}
        variant={variant}
        className={buttonClassName}
      >
        {children}
      </ButtonBase>
    </BaseLink>
  );
};
