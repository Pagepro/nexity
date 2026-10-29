"use client";

import clsx from "clsx";
import { type ReactNode, useEffect, useState } from "react";

import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";

interface TestimonialsCarouselProps {
  // Cards arrive server-rendered: importing RichText here would ship Portable Text
  // and every block renderer to the browser.
  slides: { key: string; card: ReactNode }[];
}

export const TestimonialsCarousel = ({ slides }: TestimonialsCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    const sync = () => {
      setSnapCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    };

    sync();
    api.on("select", sync);
    api.on("reInit", sync);

    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  return (
    <div className="flex w-full flex-col items-center gap-8 md:gap-12">
      <Carousel setApi={setApi} opts={{ align: "start" }} className="w-full">
        {/* p-0.5 inside the overflow-hidden embla viewport so the cards' shadow
            border isn't clipped. */}
        <CarouselContent className="-ml-8 p-0.5">
          {slides.map(({ key, card }) => (
            <CarouselItem key={key} className="basis-full pl-8 md:basis-1/2 lg:basis-1/3">
              {card}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {snapCount > 1 && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: snapCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to testimonial ${index + 1}`}
              aria-current={index === current}
              onClick={() => api?.scrollTo(index)}
              className={clsx(
                "h-2 rounded-full transition-all",
                index === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/20",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
