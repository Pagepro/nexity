import { VARIANT } from "./consts";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof VARIANT;
  beforeBgClassName?: string;
}
