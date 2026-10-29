"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import { useEffect, useRef } from "react";

import { useCloseIfPointerLeftDuringLoad } from "@/lib/use-load-on-intent";

import { FeatureHintButton } from "./feature-hint-button";

interface FeatureHintTooltipProps {
  hint: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shouldFocusTrigger: boolean;
}

// Replacing the plain button remounts the `<button>`, so focus is moved back onto it.
export const FeatureHintTooltip = ({
  hint,
  open,
  onOpenChange,
  shouldFocusTrigger,
}: FeatureHintTooltipProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (shouldFocusTrigger) triggerRef.current?.focus({ preventScroll: true });
    // Only on mount: the swap from the plain button is the one moment focus is lost.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useCloseIfPointerLeftDuringLoad(triggerRef, open && !shouldFocusTrigger, () =>
    onOpenChange(false),
  );

  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <TooltipPrimitive.Trigger asChild ref={triggerRef}>
          <FeatureHintButton hint={hint} />
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            sideOffset={6}
            className="z-50 max-w-xs rounded-md bg-foreground px-2.5 py-1.5 text-12 text-background shadow-md data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95"
          >
            {hint}
            <TooltipPrimitive.Arrow className="fill-foreground" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};
