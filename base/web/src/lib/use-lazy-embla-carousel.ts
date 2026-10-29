"use client";

import type {
  EmblaCarouselType,
  EmblaOptionsType,
  EmblaPluginType,
} from "embla-carousel";
import { useEffect, useState } from "react";

import { afterPageLoad } from "./after-page-load";

// Use instead of `embla-carousel-react`, which imports Embla statically into first-load JS.
// Embla attaches to the server HTML (no remount); `options` and `loadPlugins` are read once.
export const useLazyEmblaCarousel = (
  options?: EmblaOptionsType,
  loadPlugins?: () => Promise<EmblaPluginType[]>,
) => {
  const [initial] = useState(() => ({ options, loadPlugins }));
  const [viewport, setViewport] = useState<HTMLElement | null>(null);
  const [api, setApi] = useState<EmblaCarouselType>();

  useEffect(() => {
    if (!viewport) return;

    let embla: EmblaCarouselType | undefined;
    let isCancelled = false;

    afterPageLoad()
      .then(() => Promise.all([import("embla-carousel"), initial.loadPlugins?.() ?? []]))
      .then(([{ default: EmblaCarousel }, plugins]) => {
        if (isCancelled) return;
        embla = EmblaCarousel(viewport, initial.options, plugins);
        setApi(embla);
      })
      // A failed chunk load leaves the static first slide, which is usable.
      .catch(() => undefined);

    return () => {
      isCancelled = true;
      embla?.destroy();
    };
  }, [viewport, initial]);

  return [setViewport, api] as const;
};
