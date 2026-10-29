"use client";

import { Button, Card } from "@sanity/ui";
import { Popover } from "@sanity/ui/popover";
import { useState } from "react";
import { VscEye, VscEyeClosed } from "react-icons/vsc";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";
const PREVIEW_WIDTH = 320;

export function OgImagePreview({ title }: { title?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const imageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(title ?? "")}`;

  return (
    <Popover
      open={isOpen}
      placement="bottom-start"
      portal
      content={
        <Card radius={2} overflow="hidden">
          {isOpen && (
            <img
              src={imageUrl}
              alt="Social sharing preview"
              width={PREVIEW_WIDTH}
              height={Math.round((PREVIEW_WIDTH * 630) / 1200)}
              style={{ display: "block" }}
            />
          )}
        </Card>
      }
    >
      <Button
        mode="bleed"
        fontSize={1}
        padding={2}
        icon={isOpen ? VscEyeClosed : VscEye}
        text="OG image"
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
      />
    </Popover>
  );
}
