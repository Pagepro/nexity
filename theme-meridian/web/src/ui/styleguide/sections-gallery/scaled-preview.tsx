"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * `position: sticky/fixed` and `100vw/vh` inside the scaled stage reference the
 * gallery viewport, not the stage; move a misbehaving section to an iframe if needed.
 */
export const ScaledPreview = ({
  children,
  designWidth = 1280,
  className,
}: {
  children: ReactNode;
  designWidth?: number;
  className?: string;
}) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const node = windowRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = windowRef.current;
    if (!node) return;

    const update = () => setScale(node.clientWidth / designWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, [designWidth]);

  return (
    <div
      ref={windowRef}
      className={cn(
        "relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-muted",
        className,
      )}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "auto 320px",
      }}
    >
      {mounted && scale > 0 && (
        <div
          inert
          aria-hidden
          className="absolute top-0 left-0 origin-top-left [contain:layout_paint]"
          style={{
            width: designWidth,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-muted" />
    </div>
  );
};
