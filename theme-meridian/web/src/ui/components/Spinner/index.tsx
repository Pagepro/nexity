import clsx from "clsx";

import { VARIANT } from "./consts";
import { SpinnerProps } from "./types";

const Spinner: React.FC<SpinnerProps> = ({
  variant = "Primary",
  beforeBgClassName = "before:bg-white",
  ...props
}) => (
  <div
    className={clsx(
      "relative animate-spin rounded-full bg-conic before:absolute before:top-1/2 before:left-1/2 before:size-[calc(100%-.25rem)] before:transform-[translate(-50%,-50%)] before:rounded-full",
      VARIANT[variant],
      beforeBgClassName,
      props.className,
    )}
    role="status"
    aria-label={props["aria-label"] || "Loading"}
  >
    <span className="sr-only">Loading...</span>
  </div>
);

export default Spinner;
