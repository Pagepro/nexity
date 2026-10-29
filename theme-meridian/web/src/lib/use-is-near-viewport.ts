"use client";

import { type RefObject, useEffect, useState } from "react";

// The server HTML must already look right before this flips to `true`.
export const useIsNearViewport = (
  ref: RefObject<Element | null>,
  rootMargin = "200px",
) => {
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element || isNearViewport) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, rootMargin, isNearViewport]);

  return isNearViewport;
};
