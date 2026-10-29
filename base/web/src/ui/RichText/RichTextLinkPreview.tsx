"use client";

import { type PointerEvent, useState } from "react";

import { useLoadOnIntent } from "@/lib/use-load-on-intent";
import { LinkFragment } from "@/types/fragments";
import { BaseLink } from "@/ui/components/Link/BaseLink";

import { LinkPreview } from "./types";

// Radix HoverCard (~25 KB gz) loads on the first hover or focus, not with the page.
const loadPreviewCard = () => import("./RichTextLinkPreviewCard");

interface RichTextLinkPreviewProps {
  link: LinkFragment;
  preview: LinkPreview;
  className: string;
  children: React.ReactNode;
}

export const RichTextLinkPreview = ({
  link,
  preview,
  className,
  children,
}: RichTextLinkPreviewProps) => {
  const [previewCardModule, requestPreviewCard] = useLoadOnIntent(loadPreviewCard);
  const [isOpen, setIsOpen] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);

  if (previewCardModule) {
    const { RichTextLinkPreviewCard } = previewCardModule;

    return (
      <RichTextLinkPreviewCard
        link={link}
        preview={preview}
        className={className}
        open={isOpen}
        onOpenChange={setIsOpen}
        shouldFocusTrigger={hasFocus}
      >
        {children}
      </RichTextLinkPreviewCard>
    );
  }

  // Radix hover cards ignore touch (a tap navigates), so touch doesn't load it.
  const handlePointerEnter = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    setIsOpen(true);
    requestPreviewCard();
  };

  const handleFocus = () => {
    setHasFocus(true);
    setIsOpen(true);
    requestPreviewCard();
  };

  const handleBlur = () => {
    setHasFocus(false);
    setIsOpen(false);
  };

  return (
    <BaseLink
      link={link}
      className={className}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={() => setIsOpen(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </BaseLink>
  );
};
