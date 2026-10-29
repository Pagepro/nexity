"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

const InteractionContext = createContext(false);

const INTERACTION_EVENTS = ["pointerdown", "keydown", "scroll"] as const;

// Visitors who never interact must still get the consent banner.
const IDLE_FALLBACK_DELAY = 5000;

// Delay first, then idle: `requestIdleCallback` alone fires right after hydration, which
// put the consent banner's long tasks in the load window.
const scheduleIdleFallback = (callback: () => void) => {
  let idleCallbackId: number | undefined;

  const timeoutId = window.setTimeout(() => {
    if (typeof window.requestIdleCallback === "function") {
      idleCallbackId = window.requestIdleCallback(callback, { timeout: 1000 });
    } else {
      callback();
    }
  }, IDLE_FALLBACK_DELAY);

  return () => {
    window.clearTimeout(timeoutId);
    if (idleCallbackId !== undefined) {
      window.cancelIdleCallback(idleCallbackId);
    }
  };
};

interface Props {
  children: ReactNode;
}

export const InteractionProvider = ({ children }: Props) => {
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (hasInteracted) return;

    const handleInteraction = () => setHasInteracted(true);
    const options: AddEventListenerOptions = {
      once: true,
      passive: true,
      capture: true,
    };

    for (const eventName of INTERACTION_EVENTS) {
      window.addEventListener(eventName, handleInteraction, options);
    }

    const cancelIdleFallback = scheduleIdleFallback(handleInteraction);

    return () => {
      for (const eventName of INTERACTION_EVENTS) {
        window.removeEventListener(eventName, handleInteraction, options);
      }
      cancelIdleFallback();
    };
  }, [hasInteracted]);

  return (
    <InteractionContext.Provider value={hasInteracted}>
      {children}
    </InteractionContext.Provider>
  );
};

export const useHasInteracted = () => useContext(InteractionContext);
