import { ReactNode } from "react";

import { CTAFragment } from "@/types/fragments";

export const BUTTON_VARIANTS = [
  "primary",
  "secondary",
  "primary-outline",
  "secondary-outline",
  "ghost",
  "link",
  "arrow-link",
  "light",
  "light-outline",
  "plain",
] as const;

export const BUTTON_SIZES = ["sm", "md", "lg"] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export interface CommonButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
}

export interface ButtonProps
  extends React.HTMLAttributes<HTMLButtonElement>, CommonButtonProps {}

export interface ButtonBaseProps
  extends React.HTMLAttributes<HTMLSpanElement>, CommonButtonProps {}

export interface ButtonLinkProps extends CommonButtonProps {
  className?: string;
  buttonClassName?: string;
  onClick?: () => void;
  buttonIcon?: CTAFragment["buttonIcon"];
  link?: CTAFragment["link"];
}
