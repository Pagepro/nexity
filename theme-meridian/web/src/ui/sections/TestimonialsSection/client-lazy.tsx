"use client";

import dynamic from "next/dynamic";

export const TestimonialsCarousel = dynamic(() =>
  import("./client").then((module) => module.TestimonialsCarousel),
);
