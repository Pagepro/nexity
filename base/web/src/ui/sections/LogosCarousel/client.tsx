"use client";

import type { ReactNode } from "react";

import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

// CMS tempo (1–5) × this = AutoScroll px/frame.
const PX_PER_FRAME_PER_STEP = 0.35;
const DEFAULT_TEMPO = 2;

interface LogosTrackProps {
  // Rendered by the server (`<Img>`), so no image code ships here.
  slides: { key: string; logo: ReactNode }[];
  speed?: number | null;
}

export const LogosTrack = ({ slides, speed }: LogosTrackProps) => {
  const tempo =
    typeof speed === "number" ? Math.min(Math.max(speed, 1), 5) : DEFAULT_TEMPO;
  const scrollSpeed = tempo * PX_PER_FRAME_PER_STEP;

  const loadPlugins = () =>
    import("embla-carousel-auto-scroll").then(({ default: AutoScroll }) => [
      AutoScroll({
        playOnInit: true,
        speed: scrollSpeed,
        startDelay: 0,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ]);

  return (
    <div className="relative">
      <Carousel
        opts={{ loop: true, align: "start", dragFree: true }}
        loadPlugins={loadPlugins}
      >
        <CarouselContent className="items-center">
          {slides.map(({ key, logo }) => (
            <CarouselItem
              key={key}
              className="flex basis-1/3 justify-center sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
            >
              {logo}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-25 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-25 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
};
