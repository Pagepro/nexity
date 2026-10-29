import type { ExtractSectionProps } from "@/types/sections";
import {
  mockImage,
  PLACEHOLDER_LOGOS,
} from "@/ui/styleguide/sections-gallery/mock-image";

const LOGO_COUNT = 8;

export const logosCarouselFixture = {
  _type: "logos-carousel",
  _key: "gallery-fixture-logos-carousel",
  logos: Array.from({ length: LOGO_COUNT }, (_, index) => ({
    _key: `logo-${index + 1}`,
    ...mockImage(
      PLACEHOLDER_LOGOS[index % PLACEHOLDER_LOGOS.length],
      `Partner logo ${index + 1}`,
    ),
  })),
  speed: 40,
} satisfies ExtractSectionProps<"logos-carousel">;
