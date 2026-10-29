import { Info } from "lucide-react";
import type { ComponentProps } from "react";

interface FeatureHintButtonProps extends ComponentProps<"button"> {
  hint: string;
}

// Spreads `rest` so the Radix trigger can attach its ref, handlers and `data-state`.
export const FeatureHintButton = ({ hint, ...rest }: FeatureHintButtonProps) => (
  <button
    type="button"
    aria-label={hint}
    className="inline-flex shrink-0 cursor-help items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
    {...rest}
  >
    <Info className="size-4" aria-hidden />
  </button>
);
