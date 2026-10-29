import React from "react";

import ButtonBase from "./button-base";
import { ButtonProps } from "./types";

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      icon,
      iconPosition = "left",
      children,
      ...props
    },
    ref,
  ) => (
    <button ref={ref} disabled={disabled || loading} {...props}>
      <ButtonBase
        className={className}
        variant={variant}
        size={size}
        loading={loading}
        disabled={disabled}
        icon={icon}
        iconPosition={iconPosition}
        {...props}
      >
        {children}
      </ButtonBase>
    </button>
  ),
);

Button.displayName = "Button";

export default Button;
