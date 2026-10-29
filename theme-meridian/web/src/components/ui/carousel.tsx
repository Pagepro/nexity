"use client";

import clsx from "clsx";
import type {
  EmblaCarouselType,
  EmblaOptionsType,
  EmblaPluginType,
} from "embla-carousel";
import * as React from "react";

import { useIsNearViewport } from "@/lib/use-is-near-viewport";
import { useLazyEmblaCarousel } from "@/lib/use-lazy-embla-carousel";

// Keep Embla out of this file's imports: `useLazyEmblaCarousel` downloads it near the viewport.
// clsx, not cn (tailwind-merge is ~8 KB of client JS), so callers pass the track's
// negative margin on CarouselContent and the slide padding + `basis-*` on CarouselItem.

export type CarouselApi = EmblaCarouselType | undefined;

interface CarouselProps {
  /** Read once, when the carousel starts. */
  opts?: EmblaOptionsType;
  /** `import()` the plugins here, so they load with Embla. Read once. */
  loadPlugins?: () => Promise<EmblaPluginType[]>;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
}

interface CarouselContextProps {
  setViewport: (viewport: HTMLElement | null) => void;
  orientation: "horizontal" | "vertical";
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

const Carousel = ({
  orientation = "horizontal",
  opts,
  loadPlugins,
  setApi,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) => {
  const [setViewport, api] = useLazyEmblaCarousel(
    { ...opts, axis: orientation === "horizontal" ? "x" : "y" },
    loadPlugins,
  );

  React.useEffect(() => {
    if (!api || !setApi) {
      return;
    }
    setApi(api);
  }, [api, setApi]);

  return (
    <CarouselContext.Provider value={{ setViewport, orientation }}>
      <div
        className={clsx("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
};

const CarouselContent = ({ className, ...props }: React.ComponentProps<"div">) => {
  const { setViewport, orientation } = useCarousel();
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const isNearViewport = useIsNearViewport(viewportRef);

  // Embla forces a layout of every slide on start, so it starts only near the viewport.
  React.useEffect(() => {
    if (isNearViewport) {
      setViewport(viewportRef.current);
    }
  }, [isNearViewport, setViewport]);

  return (
    <div ref={viewportRef} className="overflow-hidden" data-slot="carousel-content">
      <div
        className={clsx("flex", orientation === "vertical" && "flex-col", className)}
        {...props}
      />
    </div>
  );
};

const CarouselItem = ({ className, ...props }: React.ComponentProps<"div">) => {
  useCarousel();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={clsx("min-w-0 shrink-0 grow-0", className)}
      {...props}
    />
  );
};

export { Carousel, CarouselContent, CarouselItem };
