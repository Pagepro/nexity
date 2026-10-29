"use client";

import { type PointerEvent, useState } from "react";

import { useLoadOnIntent } from "@/lib/use-load-on-intent";

import { FeatureHintButton } from "./feature-hint-button";

// Keeps Radix Tooltip out of the page bundle: it loads on the first hover or focus.
const loadTooltip = () => import("./feature-hint-tooltip");

interface FeatureHintProps {
  hint: string;
}

export const FeatureHint = ({ hint }: FeatureHintProps) => {
  const [tooltipModule, requestTooltip] = useLoadOnIntent(loadTooltip);
  const [isOpen, setIsOpen] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);

  if (tooltipModule) {
    const { FeatureHintTooltip } = tooltipModule;

    return (
      <FeatureHintTooltip
        hint={hint}
        open={isOpen}
        onOpenChange={setIsOpen}
        shouldFocusTrigger={hasFocus}
      />
    );
  }

  // Radix tooltips don't open on touch hover; a tap focuses the button instead.
  const handlePointerEnter = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    setIsOpen(true);
    requestTooltip();
  };

  const handleFocus = () => {
    setHasFocus(true);
    setIsOpen(true);
    requestTooltip();
  };

  const handleBlur = () => {
    setHasFocus(false);
    setIsOpen(false);
  };

  return (
    <FeatureHintButton
      hint={hint}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={() => setIsOpen(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
};
