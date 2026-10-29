"use client";

import { useEffect, useRef } from "react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useCloseIfPointerLeftDuringLoad } from "@/lib/use-load-on-intent";
import { LinkFragment } from "@/types/fragments";
import Image from "@/ui/components/image";
import { BaseLink } from "@/ui/components/Link/BaseLink";

import { LinkPreview } from "./types";

interface RichTextLinkPreviewCardProps {
  link: LinkFragment;
  preview: LinkPreview;
  className: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shouldFocusTrigger: boolean;
  children: React.ReactNode;
}

// Replacing the plain link remounts the `<a>`, so focus is moved back onto it.
export const RichTextLinkPreviewCard = ({
  link,
  preview,
  className,
  open,
  onOpenChange,
  shouldFocusTrigger,
  children,
}: RichTextLinkPreviewCardProps) => {
  const triggerRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (shouldFocusTrigger) triggerRef.current?.focus({ preventScroll: true });
    // Only on mount: the swap from the plain link is the one moment focus is lost.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useCloseIfPointerLeftDuringLoad(triggerRef, open && !shouldFocusTrigger, () =>
    onOpenChange(false),
  );

  return (
    <HoverCard open={open} onOpenChange={onOpenChange} openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild ref={triggerRef}>
        <BaseLink link={link} className={className}>
          {children}
        </BaseLink>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-0.5">
            {preview.title && (
              <p className="text-14 font-medium text-foreground">{preview.title}</p>
            )}
            {preview.description && (
              <p className="text-14 text-muted-foreground">{preview.description}</p>
            )}
          </div>
          {preview.image?.image && (
            <div className="relative aspect-[800/400] w-full overflow-hidden rounded-lg border border-border">
              <Image
                sanityImage={preview.image}
                fill
                sizes="320px"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
