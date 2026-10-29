"use client";

import clsx from "clsx";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import ButtonBase from "@/ui/components/button/button-base";

import { copyMarkdown } from "./copy-markdown";

type CopyStatus = "idle" | "copying" | "copied" | "error";

const LABELS: Record<CopyStatus, string> = {
  idle: "Copy as Markdown",
  copying: "Copying…",
  copied: "Copied",
  error: "Copy failed",
};

const ICONS = { idle: Copy, copying: Copy, copied: Check, error: TriangleAlert } as const;

const RESET_AFTER_MS = 2000;

interface CopyMarkdownButtonProps {
  markdownPath: string;
  className?: string;
}

export const CopyMarkdownButton = ({
  markdownPath,
  className,
}: CopyMarkdownButtonProps) => {
  const [status, setStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (status !== "copied" && status !== "error") return;

    const timeout = window.setTimeout(() => setStatus("idle"), RESET_AFTER_MS);

    return () => window.clearTimeout(timeout);
  }, [status]);

  const handleClick = async () => {
    setStatus("copying");

    try {
      await copyMarkdown(markdownPath);
      setStatus("copied");
    } catch (error) {
      console.error("[copy-markdown]", error);
      setStatus("error");
    }
  };

  const Icon = ICONS[status];

  // A plain <button> around ButtonBase: `Button` spreads its props onto the inner
  // span too, which would run `onClick` twice.
  return (
    <button
      type="button"
      className={clsx(
        "cursor-pointer rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-progress",
        className,
      )}
      onClick={handleClick}
      disabled={status === "copying"}
      aria-live="polite"
    >
      <ButtonBase
        variant="primary-outline"
        size="sm"
        icon={<Icon className="size-4" aria-hidden />}
      >
        {LABELS[status]}
      </ButtonBase>
    </button>
  );
};
