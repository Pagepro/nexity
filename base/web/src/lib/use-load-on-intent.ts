"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

// Pass a loader defined at module scope so `request` stays stable.
export const useLoadOnIntent = <TModule>(loader: () => Promise<TModule>) => {
  const [loadedModule, setLoadedModule] = useState<TModule | null>(null);
  const isRequestedRef = useRef(false);

  const request = useCallback(() => {
    if (isRequestedRef.current) return;
    isRequestedRef.current = true;

    loader()
      .then((module) => setLoadedModule(module))
      .catch(() => {
        isRequestedRef.current = false;
      });
  }, [loader]);

  return [loadedModule, request] as const;
};

// The swapped-in trigger never got a pointer event, so if the next move lands outside it
// never gets `pointerleave` and the Radix popover stays open.
export const useCloseIfPointerLeftDuringLoad = (
  triggerRef: RefObject<HTMLElement | null>,
  isOpenedByPointer: boolean,
  onClose: () => void,
) => {
  useEffect(() => {
    if (!isOpenedByPointer) return;

    const handlePointerMove = (event: PointerEvent) => {
      document.removeEventListener("pointermove", handlePointerMove);
      const target = event.target as Element | null;
      const isOnTrigger = Boolean(target && triggerRef.current?.contains(target));
      const isOnContent = Boolean(target?.closest("[data-radix-popper-content-wrapper]"));
      if (!isOnTrigger && !isOnContent) onClose();
    };

    document.addEventListener("pointermove", handlePointerMove);
    return () => document.removeEventListener("pointermove", handlePointerMove);
    // Only on mount: it covers the moment of the swap, not later hovers.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
